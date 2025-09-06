from django.contrib import admin
from .models import Message, Room

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("room", "username", "content", "created_at")
    search_fields = ("room", "username", "content")
    list_filter = ("room", "created_at")

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at")
    search_fields = ("id",)
