from django.urls import re_path
from .consumers import ChatConsumer

# only allow chars that Channels also allows in group names
websocket_urlpatterns = [
    re_path(r"^ws/chat/(?P<room_name>[0-9A-Za-z_.-]+)/$", ChatConsumer.as_asgi()),
]
