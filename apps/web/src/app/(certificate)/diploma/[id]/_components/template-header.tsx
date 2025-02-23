import Logo from "~/app/_components/brand/logo";
import Wordmark from "~/app/_components/brand/wordmark";
import type { TemplateData } from "./template";

export function TemplateHeader({
  gearTypeTitle,
  programTitle,
  courseTitle,
  degreeRang,
}: {
  gearTypeTitle: TemplateData["gearType"]["title"];
  programTitle: TemplateData["program"]["title"];
  courseTitle: TemplateData["program"]["course"]["title"];
  degreeRang: TemplateData["program"]["degree"]["rang"];
}) {
  return (
    <header className="bg-branding-light space-y-4 flex justify-center flex-col py-4">
      <div className="bg-white flex justify-between rounded-full my-1 mx-4 items-center p-2">
        <div className="flex shrink-0">
          <Logo className="h-24 w-24 p-2 hidden @sm:block text-white" />
          <Wordmark className="h-24 hidden @lg:block" />
        </div>
        <div className="flex gap-4 pr-4">
          <div className="flex flex-col justify-center text-end">
            <p className="text-lg @sm:text-xl @lg:text-2xl leading-5 font-bold">
              {gearTypeTitle}
            </p>
            <p className="text-sm @sm:text-base leading-5 @lg:text-lg">
              {programTitle ?? courseTitle}
            </p>
          </div>
          <p className="text-6xl font-black text-branding-orange align-text-bottom">
            {degreeRang}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="bg-white h-1 w-full" />
        <div className="bg-white h-1 w-full" />
      </div>
    </header>
  );
}
