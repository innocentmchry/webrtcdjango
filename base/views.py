from django.shortcuts import render
from django.http import JsonResponse
from agora_token_builder import RtcTokenBuilder
import random
import time
import json

from .models import RoomMember, Admin

from django.views.decorators.csrf import csrf_exempt

# Create your views here.

def getToken(request):
    appId = '67cfc50c50834b7293ed8598993d29bd'
    appCertificate = '23f91830ba4e450784e9164c118e9bb0'
    channelName = request.GET.get('channel')
    uid = random.randint(1, 230)
    expirationTimeInSeconds = 3600 * 24
    currentTimeStamp = int(time.time())
    privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds
    role = 1
    
    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)
    return JsonResponse({'token':token, 'uid':uid}, safe=False)

def lobby(request):
    return render(request, 'base/lobby.html')

def room(request):
    return render(request, 'base/room.html')


# we gonna send a post request to this backend below
# we gonna get a post request from front end

@csrf_exempt
def createMember(request):
    data = json.loads(request.body)
    
    # check if data['email'] is contained in a database named Admin which has column named email, if so assign the role as admin, other wise asign as participant

    print(data)
    email = data['email']
    
    try:
        admin = Admin.objects.get(email=email)
        role = "admin"
    except Admin.DoesNotExist:
        role = "participant"
    
    member, created = RoomMember.objects.get_or_create(
        name=data['name'],
        uid=data['UID'],
        room_name=data['room_name'],
        role=role
    )
    return JsonResponse({'name':data['name'], 'role':role}, safe=False)


def getMember(request):
    # getting the parameters from the get request
    uid = request.GET.get('UID')
    room_name = request.GET.get('room_name')
    
    # quering the member
    member = RoomMember.objects.get(
        uid=uid,
        room_name=room_name,
        
    )
    
    # returning back the name    
    name = member.name
    role = member.role
    return JsonResponse({'name':name, 'role':role}, safe=False)

@csrf_exempt
def deleteMember(request):
    data = json.loads(request.body)
    
    member = RoomMember.objects.get(
        name=data['name'],
        uid=data['UID'],
        room_name=data['room_name'],
    )
    member.delete()
    return JsonResponse('Member was deleted', safe=False)
