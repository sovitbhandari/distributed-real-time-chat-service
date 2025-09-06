from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class Room(models.Model):
    # e.g. "general", "proj-123"
    id = models.SlugField(primary_key=True, max_length=100)
    password_hash = models.CharField(max_length=128, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw: str):
        self.password_hash = make_password(raw)

    def check_password(self, raw: str) -> bool:
        return bool(self.password_hash) and check_password(raw, self.password_hash)

    def __str__(self):
        return self.id

class Message(models.Model):
    room = models.CharField(max_length=100, db_index=True)
    username = models.CharField(max_length=50)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["room", "created_at"])]

    def __str__(self):
        return f"[{self.room}] {self.username}: {self.content[:20]}"
