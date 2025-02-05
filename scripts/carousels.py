import os
import sys
import json
import random
import numpy as np

import requests

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import cv2
from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_audioclips

FONT = "/app/scripts/arial.ttf"
WIDTH = 2000

def text_wrap(text, font, max_width):

    lines = []

    if font.getsize(text)[0] <= max_width:
        lines.append(text)
    else:
        words = text.split(" ")
        i = 0
        while i < len(words):
            line = []
            while i < len(words) and font.getsize(" ".join(line + [words[i]]))[0] <= max_width:
                line = line + [words[i]]
                i += 1
            line = " ".join(line)
            if not line:
                line = words[i]
                i += 1
            lines.append(line)

    return lines

def load_image(path):

    image = Image.open(path)
    img_w = image.size[0]
    img_h = image.size[1]
    wpercent = (WIDTH / float(img_w))
    hsize = int((float(img_h) * float(wpercent)))
    r_img = image.resize((WIDTH, hsize), Image.ANTIALIAS)

    return r_img

def create_section(section, num_elements):
    
    images_path = section["images_path"]
    texts = section["texts"]
    elements = []
       
    for i in range(num_elements):
        
        pos = {"random": random.choice([60, 90]),
               "middle": 60,
               "bottom": 90}
        
        text = "" if not(len(texts)) else random.choice(texts)
        text_font = ImageFont.truetype(font = FONT, size = random.randint(60, 70))
        text_position = pos.get(section["textPosition"])
        text_color = section["textColor"]
        # text_bg_color = section["textBgColor"]
        text_bg_color = section.get("textBgColor", "red")
        element_path = random.choice(images_path)
        element = load_image(element_path)

        if text != "":
            
            draw = ImageDraw.Draw(element)
            
            x_start = 15
            x_min = (element.size[0] * x_start) // 100
            x_max = (element.size[0] * (100 - 2 * x_start)) // 100
            
            lines = text_wrap(text, text_font, x_max)
            line_height = text_font.getsize('hg')[1]
            
            y_min = (element.size[1] * 4) // 100
            y_max = (element.size[1] * text_position) //100
            y_max -= (len(lines) * line_height)

            y = y_max
            
            for line in lines:
                _x1, _y1, _x2, _y2 = draw.textbbox((x_min, y), line, font = text_font)
                x_n = x_min + (x_min + x_max - _x2) / 2
                draw.rounded_rectangle([(x_n - 15, _y1 - 15), (x_n + _x2 - x_min + 15, _y2 + 15)],
                                    fill = text_bg_color, radius = 3)
                draw.text((x_n, y), line, font = text_font, fill = text_color)
                y = y + line_height + 2
        
        elements.append(element)
        
    return elements

def create_carousels(sections, num_contents):
    
    carousels = []
    
    section_elements = []
    for i in range(len(sections)):
        elements = create_section(sections[i], num_contents)
        section_elements.append(elements)
        
    for i in range(num_contents):
        carousel = []
        for j in range(len(section_elements)):
            carousel.append(section_elements[j][i])
        carousels.append(carousel)
        
    return carousels

class Generator():
    
    def __init__(self, base_path, target, sections, captions, hashtags):
        
        self.base_path = base_path
        self.target = target
        self.sections = sections
        self.captions = captions
        self.hashtags = hashtags
        self.distributed = []
        
        for s in sections:
            s["images_path"] = []
        
    def create_directories(self):
        
        if "resources" not in os.listdir(self.base_path):
            os.mkdir("/".join([self.base_path, "resources"]))
            
        if "tmp" not in os.listdir(self.base_path):
            os.mkdir("/".join([self.base_path, "tmp"]))
            
        for i in range(len(self.target)):
            temp_path = "/".join([self.base_path, "tmp", self.target[i]["path"]])
            target_path = "/".join([self.base_path, self.target[i]["path"]])
            paths = [temp_path, target_path + "/carousels", target_path + "/videos"]
            for j in range(len(paths)):
                try:
                    os.makedirs(paths[j])
                except:
                    pass
        
    def download_images(self):
    
        for i in range(len(self.sections)):
            images = self.sections[i]["images"]
            for j in range(len(images)):
                path = self.base_path + "/resources/{}_{}".format(i, j)
                r = requests.get(images[j])
                if r.status_code == 200:
                    with open(path, 'wb') as f:
                        f.write(r.content)
                    self.sections[i]["images_path"].append(path)
                    
    def distribute(self):
        
        l = 0
        
        for i in range(len(self.target)):
            
            target_path = "/".join([self.base_path, self.target[i]["path"]])
            num_contents = self.target[i]["amountOfTroops"]
            carousels = create_carousels(self.sections, num_contents)
            
            for j in range(len(carousels)):
                for k in range(len(carousels[j])):
                    carousel_path = target_path + "/carousels/sort_{}_{}.jpg".format(k, j)
                    carousels[j][k].save(carousel_path)
                    self.distributed.append(carousel_path)
                    
            captions = list(map(lambda c: " ".join([c, self.hashtags]), self.captions[l:l+num_contents]))
            with open(target_path + "/carousels/captions", "w", encoding = "utf8") as fp:
                fp.write('\n'.join(captions))
                fp.write('\n')
            self.distributed.append(target_path + "/carousels/captions")
            l += num_contents

    def json_reports(self):

        with open(self.base_path + "/out.json", "w") as fp:
            json.dump({"files": self.distributed}, fp)
            
    def run(self):
        
        self.create_directories()
        self.download_images()
        self.distribute()
        self.json_reports()

if __name__ == "__main__":

    with open(sys.argv[1], "r") as fp:
        config = json.load(fp)

    base_path = config["basePath"]
    target = config["groupDistribution"]

    captions = config["captions"]
    hashtags = config["hashtags"]
    sections = config["sections"]

    generator = Generator(base_path, target, sections, captions, hashtags)
    generator.run()
