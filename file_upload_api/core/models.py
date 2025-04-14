from django.db import models

class GraderAssignment(models.Model):
    course_number = models.CharField(max_length=50)
    professor_name = models.CharField(max_length=100)
    assigned_grader = models.CharField(max_length=100, blank=True, null=True)
    grader_major = models.CharField(max_length=100, blank=True, null=True)
    grader_email = models.EmailField(blank=True, null=True)
    justification = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.course_number} - {self.professor_name}"
