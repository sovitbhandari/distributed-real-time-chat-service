# chat/views.py
import json, random
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.utils.text import slugify
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from .models import Message, Room

@ensure_csrf_cookie
def index(request):
    return render(request, "chat/index.html")

@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"ok": True})

@ensure_csrf_cookie
def room(request, room_name):
    if "username" not in request.session:
        request.session["username"] = f"user{random.randint(1000, 9999)}"

    rooms = request.session.get("rooms", {})
    rooms[room_name] = True     # <-- authorizes this room for WS
    request.session["rooms"] = rooms
    request.session.modified = True

    last_messages = Message.objects.filter(room=room_name).order_by("-created_at")[:50]
    return render(request, "chat/room.html", {
        "room_name": room_name,
        "username": request.session["username"],
        "messages": reversed(last_messages),
    })

def health(request): return HttpResponse("ok")
def metrics(request): return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)

@require_POST
def api_create_room(request):
    try:
        data = json.loads(request.body or "{}")
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")
    room_id_raw = (data.get("id") or "").strip()
    password = (data.get("password") or "").strip()
    if not room_id_raw or not password:
        return HttpResponseBadRequest("id and password required")
    room_id = slugify(room_id_raw)[:100]
    if not room_id:
        return HttpResponseBadRequest("invalid id")
    room, created = Room.objects.get_or_create(pk=room_id)
    room.set_password(password)
    room.save()

    # SPA clients do not hit `room()` view before opening WS, so authorize now.
    rooms = request.session.get("rooms", {})
    rooms[room.id] = True
    request.session["rooms"] = rooms
    if "username" not in request.session:
        request.session["username"] = f"user{random.randint(1000, 9999)}"
    request.session.modified = True

    return JsonResponse({
        "ok": True,
        "id": room.id,
        "join_url": reverse("api_join_room", kwargs={"room_id": room.id}),
        "page_url": reverse("room", kwargs={"room_name": room.id}),
    }, status=201 if created else 200)

@require_POST
def api_join_room(request, room_id):
    try:
        data = json.loads(request.body or "{}")
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")
    password = (data.get("password") or "").strip()
    username = (data.get("username") or "").strip() or f"user{random.randint(1000, 9999)}"
    room = get_object_or_404(Room, pk=room_id)
    if not room.check_password(password):
        return HttpResponseForbidden("wrong password")
    rooms = request.session.get("rooms", {})
    rooms[room_id] = True
    request.session["rooms"] = rooms
    request.session["username"] = username
    request.session.modified = True
    return JsonResponse({"ok": True})
