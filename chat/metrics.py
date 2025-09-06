from prometheus_client import Counter, Gauge, Histogram

connected_clients = Gauge(
    "djchat_connected_clients",
    "Current number of connected WebSocket clients",
)

messages_total = Counter(
    "djchat_messages_total",
    "Total chat messages broadcast",
)

broadcast_seconds = Histogram(
    "djchat_broadcast_seconds",
    "Time spent broadcasting a message to the room",
    buckets=(0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2)
)
