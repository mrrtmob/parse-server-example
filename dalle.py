import os
import logging
from openai import OpenAI
import requests
from PIL import Image, ImageDraw
from io import BytesIO

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize OpenAI client
client = OpenAI(api_key="sk-proj-cGC5Z4DPI85DxSW1DF9ZT3BlbkFJUXG2srpX6qBJjGsZiUSu")

def create_mask(size, area):
    """Create a mask for editing."""
    mask = Image.new('RGBA', size, (0, 0, 0, 0))  # Transparent mask
    draw = ImageDraw.Draw(mask)
    draw.rectangle(area, fill=(255, 255, 255, 255))  # White rectangle for the area to edit
    return mask

def download_image(url):
    """Download an image from a URL."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        return Image.open(BytesIO(response.content)).convert("RGBA")
    except requests.RequestException as e:
        logging.error(f"Failed to download image: {e}")
        return None

def prepare_image_for_api(image):
    """Prepare image for API submission."""
    img_byte_arr = BytesIO()
    image.save(img_byte_arr, format='PNG')
    return img_byte_arr.getvalue()

def generate_image(prompt):
    """Generate an image using DALL-E 3."""
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1
        )
        return response.data[0].url
    except Exception as e:
        logging.error(f"Error during image generation: {e}")
        return None

def edit_image(image, edit_prompt, mask_area=None):
    """Edit an image using OpenAI's API."""
    # Create mask (default to editing the entire image if no area specified)
    if mask_area is None:
        mask_area = (0, 0, image.width, image.height)
    mask = create_mask(image.size, mask_area)

    # Prepare image and mask for API
    img_bytes = prepare_image_for_api(image)
    mask_bytes = prepare_image_for_api(mask)

    try:
        response = client.images.edit(
            image=img_bytes,
            mask=mask_bytes,
            prompt=edit_prompt,
            n=1,
            size="1024x1024"
        )
        return response.data[0].url
    except Exception as e:
        logging.error(f"Error during image editing: {e}")
        return None

def save_image(url, filename):
    """Save an image from a URL to a file."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        with open(filename, 'wb') as f:
            f.write(response.content)
        logging.info(f"Image saved as '{filename}'")
    except requests.RequestException as e:
        logging.error(f"Failed to save image: {e}")

def main():
    # Generate image prompt
    generate_prompt = "An indoor lounge area with a brown dog swimming in the pool. The lounge has modern furniture and large windows overlooking a cityscape."
    
    # Edit prompt
    edit_prompt = "Add a cat sitting on one of the lounge chairs in the bottom-right quarter of the image"
    
    logging.info("Starting image generation and edit process...")

    # Generate the initial image
    generated_image_url = generate_image(generate_prompt)
    if not generated_image_url:
        logging.error("Failed to generate the initial image.")
        return

    # Save the generated image
    save_image(generated_image_url, 'output/generated_image.png')

    # Download the generated image
    image = download_image(generated_image_url)
    if image is None:
        return

    # Set the mask area to the bottom-right quarter
    mask_area = (image.width // 2, image.height // 2, image.width, image.height)

    # Perform the edit
    edited_image_url = edit_image(image, edit_prompt, mask_area)

    if edited_image_url:
        # Save the edited image
        save_image(edited_image_url, 'output/edited_image.png')
    else:
        logging.error("Failed to edit the image.")

if __name__ == "__main__":
    main()