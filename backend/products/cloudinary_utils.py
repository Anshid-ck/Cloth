"""
Cloudinary image upload utilities for the products app.
Handles image validation, upload, and deletion with proper error handling.
"""
import cloudinary
import cloudinary.uploader
import cloudinary.api
from django.conf import settings
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

# Allowed image formats
ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

# Maximum file size in bytes (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024


def validate_image(image_file):
    """
    Validate image file type and size.
    
    Args:
        image_file: Django UploadedFile object
        
    Raises:
        ValidationError: If validation fails
    """
    # Check file size
    if image_file.size > MAX_FILE_SIZE:
        raise ValidationError(
            f"Image file too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.1f}MB"
        )
    
    # Check file format
    file_extension = image_file.name.split('.')[-1].lower()
    if file_extension not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError(
            f"Invalid image format. Allowed formats: {', '.join(ALLOWED_IMAGE_FORMATS)}"
        )
    
    # Check if it's actually an image
    if not image_file.content_type.startswith('image/'):
        raise ValidationError("File is not a valid image")
    
    return True


def upload_image_to_cloudinary(image_file, folder='products', public_id=None):
    """
    Upload a single image to Cloudinary with validation.
    
    Args:
        image_file: Django UploadedFile object
        folder: Cloudinary folder name (default: 'products')
        public_id: Optional custom public_id for the image
        
    Returns:
        dict: Upload result with keys: url, public_id, secure_url, format, width, height
        
    Raises:
        ValidationError: If image validation fails
        Exception: If upload fails
    """
    try:
        # Validate the image first
        validate_image(image_file)
        
        # Prepare upload options
        upload_options = {
            'folder': folder,
            'resource_type': 'image',
            'quality': 'auto',
            'fetch_format': 'auto',
        }
        
        if public_id:
            upload_options['public_id'] = public_id
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            image_file,
            **upload_options
        )
        
        logger.info(f"Successfully uploaded image to Cloudinary: {result.get('public_id')}")
        
        return {
            'url': result.get('url'),
            'secure_url': result.get('secure_url'),
            'public_id': result.get('public_id'),
            'format': result.get('format'),
            'width': result.get('width'),
            'height': result.get('height'),
        }
        
    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Cloudinary upload error: {str(e)}")
        raise Exception(f"Failed to upload image to Cloudinary: {str(e)}")


def upload_multiple_images(image_files, folder='products'):
    """
    Upload multiple images to Cloudinary.
    
    Args:
        image_files: List of Django UploadedFile objects
        folder: Cloudinary folder name (default: 'products')
        
    Returns:
        list: List of upload results, each containing url, public_id, etc.
        dict: Errors dict with failed uploads
    """
    results = []
    errors = {}
    
    for idx, image_file in enumerate(image_files):
        try:
            result = upload_image_to_cloudinary(image_file, folder=folder)
            results.append(result)
        except Exception as e:
            errors[f"image_{idx}"] = str(e)
            logger.error(f"Failed to upload image {idx}: {str(e)}")
    
    return results, errors


def delete_image_from_cloudinary(public_id):
    """
    Delete an image from Cloudinary.
    
    Args:
        public_id: The Cloudinary public_id of the image to delete
        
    Returns:
        bool: True if deletion was successful
        
    Raises:
        Exception: If deletion fails
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        
        if result.get('result') == 'ok':
            logger.info(f"Successfully deleted image from Cloudinary: {public_id}")
            return True
        else:
            logger.warning(f"Failed to delete image from Cloudinary: {public_id}")
            return False
            
    except Exception as e:
        logger.error(f"Cloudinary delete error: {str(e)}")
        raise Exception(f"Failed to delete image from Cloudinary: {str(e)}")


def extract_public_id_from_url(cloudinary_url):
    """
    Extract public_id from a Cloudinary URL.
    
    Args:
        cloudinary_url: Full Cloudinary URL
        
    Returns:
        str: The public_id extracted from the URL
    """
    try:
        # Example URL: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[folder]/[public_id].[format]
        parts = cloudinary_url.split('/')
        
        # Find the upload part
        if 'upload' in parts:
            upload_idx = parts.index('upload')
            # Skip version if present (starts with 'v')
            start_idx = upload_idx + 2 if parts[upload_idx + 1].startswith('v') else upload_idx + 1
            # Join remaining parts and remove extension
            public_id_with_ext = '/'.join(parts[start_idx:])
            public_id = public_id_with_ext.rsplit('.', 1)[0]
            return public_id
        
        return None
    except Exception as e:
        logger.error(f"Failed to extract public_id from URL: {str(e)}")
        return None
