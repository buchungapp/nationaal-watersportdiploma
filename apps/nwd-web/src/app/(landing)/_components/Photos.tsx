import Image from "next/image";

import clsx from "clsx";
import image1 from "./_assets/photo-1.png";
import image2 from "./_assets/photo-2.png";
import image3 from "./_assets/photo-3.png";
import image4 from "./_assets/photo-4.png";
import image5 from "./_assets/photo-5.png";
import image6 from "./_assets/photo-6.png";

export default function Photos() {
  let rotations = ["rotate-2", "-rotate-2", "rotate-2"];

  return (
    <section className="flex w-full -my-4 justify-center gap-5 overflow-hidden py-4 sm:gap-8">
      {[image1, image2, image3, image4, image5, image6].map((image, imageIndex) => (
        <div
          key={image.src}
          className={clsx(
            "relative aspect-[9/10] w-32 flex-none overflow-hidden rounded-xl bg-zinc-100 sm:w-56 sm:rounded-2xl dark:bg-zinc-800",
            rotations[imageIndex % rotations.length],
          )}
        >
          <Image
            src={image}
            alt=""
            sizes="(min-width: 640px) 18rem, 11rem"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ))}
    </section>
  );
}
