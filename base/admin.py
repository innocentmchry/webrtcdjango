from django.contrib import admin

# Register your models here.
from .models import RoomMember, Admin

admin.site.register(RoomMember)
admin.site.register(Admin)