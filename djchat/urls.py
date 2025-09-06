from django.contrib import admin
from django.urls import path
from chat import views

urlpatterns = [
    path("admin/", admin.site.urls),

    # Dev helpers
    path("health", views.health, name="health"),
    path("metrics", views.metrics, name="metrics"),
    path("api/csrf", views.csrf, name="api_csrf"),

    # API
    path("api/rooms", views.api_create_room, name="api_create_room"),
    path("api/rooms/<str:room_id>/join", views.api_join_room, name="api_join_room"),

    # Server-render page (optional; SPA can handle routes instead)
    path("room/<str:room_name>/", views.room, name="room"),
    path("", views.index, name="index"),
]
