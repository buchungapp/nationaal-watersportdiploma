"use client";

import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { toast } from "sonner";
import { removeNwdCAction } from "~/app/_actions/eigenvaardigheid/manage-nwd-c";
import { Button } from "~/app/(dashboard)/_components/button";
import dayjs from "~/lib/dayjs";
import type { listCertificatesForPersonAsAdmin } from "~/lib/nwd";

type Certificate = Awaited<
  ReturnType<typeof listCertificatesForPersonAsAdmin>
>[number];

export default function RemoveNwdCDialog({
  isOpen,
  onClose,
  personId,
  certificate,
}: {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  certificate: Certificate | null;
}) {
  const handleRemove = async () => {
    if (!certificate) return;

    try {
      const result = await removeNwdCAction({
        personId,
        certificateId: certificate.id,
      });

      if (result?.data?.success) {
        toast.success("NWD-C ingetrokken");
        onClose();
      } else {
        toast.error("Intrekken mislukt");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Intrekken mislukt",
      );
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
                      NWD-C intrekken
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Weet je zeker dat je deze NWD-C registratie wilt
                        intrekken? Dit kan niet ongedaan worden gemaakt.
                      </p>
                      {certificate && (
                        <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                          <dl className="text-sm">
                            <div className="mb-1">
                              <dt className="inline font-medium text-gray-500 dark:text-gray-400">
                                Discipline:{" "}
                              </dt>
                              <dd className="inline text-gray-900 dark:text-gray-100">
                                {certificate.program.course.discipline.title}
                              </dd>
                            </div>
                            <div className="mb-1">
                              <dt className="inline font-medium text-gray-500 dark:text-gray-400">
                                Vaartuig:{" "}
                              </dt>
                              <dd className="inline text-gray-900 dark:text-gray-100">
                                {certificate.gearType.title}
                              </dd>
                            </div>
                            <div>
                              <dt className="inline font-medium text-gray-500 dark:text-gray-400">
                                Datum:{" "}
                              </dt>
                              <dd className="inline text-gray-900 dark:text-gray-100">
                                {dayjs(certificate.issuedAt).format("DD-MM-YYYY")}
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
                    Intrekken
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
