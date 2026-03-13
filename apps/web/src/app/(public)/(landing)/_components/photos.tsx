import Image from "next/image";

import image1 from "./_assets/1.jpg";
import image2 from "./_assets/2.jpg";
import image4 from "./_assets/4.jpg";
import image5 from "./_assets/5.jpg";
import image6 from "./_assets/jacht.jpg";
import image3 from "./_assets/photo-6.png";

const images = [image6, image3, image4, image2, image5, image1];

export default function Photos() {
  return (
    <section className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-6">
      {images.map((image) => (
        <div key={image.src} className="relative aspect-square bg-slate-100">
          <Image
            src={image}
            alt=""
            placeholder="blur"
            sizes="(min-width: 640px) 16.67vw, 33.33vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ))}
    </section>
  );
}
