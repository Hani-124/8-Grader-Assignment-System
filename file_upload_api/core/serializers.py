from rest_framework import serializers
from .models import GraderAssignment

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    type = serializers.CharField()

class GraderAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = GraderAssignment
        fields = '__all__'