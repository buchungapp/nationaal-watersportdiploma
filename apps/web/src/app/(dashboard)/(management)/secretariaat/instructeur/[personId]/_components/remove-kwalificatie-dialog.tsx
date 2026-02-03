"use client";

import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { removeKwalificatieAction } from "~/app/_actions/kss/manage-kwalificaties";
import { Button } from "~/app/(dashboard)/_components/button";

type Kwalificatie = {
  personId: string;
  courseId: string;
  courseTitle: string | null;
  courseHandle: string;
  kerntaakOnderdeelId: string;
  kerntaakOnderdeelType: "portfolio" | "praktijk";
  kerntaakTitel: string;
  kwalificatieprofielTitel: string;
  richting: string;
  niveau: number;
  verkregenReden: string;
  opmerkingen: string | null;
  toegevoegdOp: string | null;
};

export default function RemoveKwalificatieDialog({
  isOpen,
  onClose,
  kwalificatie,
  personId,
}: {
  isOpen: boolean;
  onClose: () => void;
  kwalificatie: Kwalificatie | null;
  personId: string;
}) {
  const handleRemove = async () => {
    if (!kwalificatie) return;

    const result = await removeKwalificatieAction({
      personId,
      courseId: kwalificatie.courseId,
      kerntaakOnderdeelId: kwalificatie.kerntaakOnderdeelId,
    });

    if (result?.data?.success) {
      onClose();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon
                      className="h-6 w-6 text-red-600 dark:text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900 dark:text-white"
                    >
                      Kwalificatie verwijderen
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Weet je zeker dat je deze kwalificatie wilt verwijderen?
                      </p>
                      {kwalificatie && (
                        <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                          <dl className="text-sm">
                            <div className="mb-1">
                              <dt className="inline font-medium text-gray-500 dark:text-gray-400">
                                Cursus:{" "}
                              </dt>
                              <dd className="inline text-gray-900 dark:text-gray-100">
                                {kwalificatie.courseTitle ||
                                  kwalificatie.courseHandle}
                              </dd>
                            </div>
                            <div className="mb-1">
                              <dt className="inline font-medium text-gray-500 dark:text-gray-400">
                                Kwalificatieprofiel:{" "}
                              </dt>
                              <dd className="inline text-gray-900 dark:text-gray-100">
                                {kwalificatie.kwalificatieprofielTitel}
                              </dd>
                            </div>
                            <div>
                              <dt className="inline font-medium text-gray-500 dark:text-gray-400">
                                Kerntaak:{" "}
                              </dt>
                              <dd className="inline text-gray-900 dark:text-gray-100">
                                {kwalificatie.kerntaakTitel}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <Button
                    type="button"
                    color="red"
                    onClick={handleRemove}
                    className="w-full sm:ml-3 sm:w-auto"
                  >
                    Verwijderen
                  </Button>
                  <Button
                    type="button"
                    outline
                    onClick={onClose}
                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                  >
                    Annuleren
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
