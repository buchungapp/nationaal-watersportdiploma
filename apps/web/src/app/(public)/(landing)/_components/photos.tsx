import clsx from "clsx";
import Image from "next/image";

import image1 from "./_assets/1.jpg";
import image2 from "./_assets/2.jpg";
import image4 from "./_assets/4.jpg";
import image5 from "./_assets/5.jpg";
import image6 from "./_assets/jacht.jpg";
import image3 from "./_assets/photo-6.png";

export default function Photos() {
  const rotations = ["rotate-2", "-rotate-2", "rotate-2"];

  return (
    <section className="-my-2 flex w-full justify-center gap-5 overflow-hidden py-4 sm:gap-8">
      {[image6, image3, image4, image2, image5, image1].map(
        (image, imageIndex) => (
          <div
            key={image.src}
            className={clsx(
              "relative aspect-9/10 w-32 flex-none overflow-hidden rounded-xl bg-zinc-100 sm:w-56 sm:rounded-2xl dark:bg-zinc-800",
              rotations[imageIndex % rotations.length],
            )}
          >
            <Image
              src={image}
              alt=""
              placeholder="blur-sm"
              sizes="(min-width: 640px) 18rem, 11rem"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ),
      )}
    </section>
  );
}
