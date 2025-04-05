# echo/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt 
def echo_view(request):
    # Handle both GET and POST
    if request.method == 'POST':
        message = request.POST.get('message', '')
    else:  # GET or others
        message = request.GET.get('message', '')
    
    return JsonResponse({'echo': message})
