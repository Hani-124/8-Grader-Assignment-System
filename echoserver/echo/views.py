# views.py

from django.http import JsonResponse, FileResponse, Http404
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.views.decorators.http import require_GET, require_http_methods
import os
from django.conf import settings

# Set up the upload directory
UPLOAD_DIR = os.path.join(settings.BASE_DIR, 'media')
os.makedirs(UPLOAD_DIR, exist_ok=True)


@ensure_csrf_cookie
@require_GET
def get_csrf(request):
    """Sets the CSRF token in a cookie."""
    return JsonResponse({"message": "CSRF cookie set!"})


@csrf_protect
@require_http_methods(["POST"])
def upload_file(request):
    """Handles file uploads."""
    uploaded_file = request.FILES.get('file')
    if not uploaded_file:
        return JsonResponse({'error': 'No file received'}, status=400)

    file_path = os.path.join(UPLOAD_DIR, uploaded_file.name)
    with open(file_path, 'wb+') as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)

    return JsonResponse({
        'message': 'File uploaded successfully!',
        'filename': uploaded_file.name,
        'download_url': f"/echo/download/{uploaded_file.name}"
    })


def download_file(request, filename):
    """Serves uploaded files back for download."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=filename)
    raise Http404("File not found")
