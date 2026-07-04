from PIL import Image
import os

base_dir = r"h:\Site Joaovcantuaria\fotografia\portfolio"
max_width = 1200
quality = 75

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.lower().endswith(('.jpg', '.jpeg', '.png')):
            filepath = os.path.join(root, file)
            size_mb = os.path.getsize(filepath) / (1024 * 1024)
            
            img = Image.open(filepath)
            
            # Converter RGBA para RGB se necessário
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # Redimensionar se maior que max_width
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.LANCZOS)
            
            # Salvar com extensão .jpg (minúsculo)
            new_name = os.path.splitext(file)[0] + ".jpg"
            new_path = os.path.join(root, new_name)
            
            # Remover original se extensão diferente
            if filepath.lower() != new_path.lower():
                os.remove(filepath)
            
            img.save(new_path, "JPEG", quality=quality, optimize=True)
            new_size_mb = os.path.getsize(new_path) / (1024 * 1024)
            print(f"{file}: {size_mb:.2f}MB -> {new_size_mb:.2f}MB")

print("\nCompressao concluida!")
