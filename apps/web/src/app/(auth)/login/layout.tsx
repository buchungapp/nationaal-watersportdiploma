import Image from "next/image";
import coverImage from "./_assets/zeilen-4.jpg";
import SessionCheck from "./_components/session-check";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex min-h-full flex-1">
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          {children}
        </div>
        <div className="relative hidden w-0 flex-1 lg:block">
          <Image
            className="absolute inset-0 h-full w-full object-cover"
            priority
            src={coverImage}
            placeholder="blur"
            alt=""
          />
        </div>
      </div>
      <SessionCheck />
    </>
  );
}
