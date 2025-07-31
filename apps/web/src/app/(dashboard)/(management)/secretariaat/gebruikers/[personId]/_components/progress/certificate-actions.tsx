"use client";

import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { useState } from "react";
import type { Certificate } from "~/app/(dashboard)/(account)/profiel/[handle]/_components/progress/certificates";
import { useProgressCard } from "~/app/(dashboard)/(account)/profiel/[handle]/_components/progress/progress-card";
import {
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Dropdown } from "~/app/(dashboard)/_components/dropdown";
import dayjs from "~/lib/dayjs";
import { WithdrawCertificateDialog } from "./dialogs/withdraw-certificate-dialog";
import { ProgressDropdownButton } from "./progress-dropdown-button";

export function CertificateActions() {
  const { type, data: certificate } = useProgressCard<Certificate>();

  const [openDialog, setOpenDialog] = useState<"withdraw-certificate" | null>(
    null,
  );

  return (
    <>
      <Dropdown>
        <ProgressDropdownButton type={type} />
        <DropdownMenu anchor="bottom end">
          <DropdownItem
            href={`/api/export/certificate/pdf/${certificate.id}?preview=true&signed=true&handle=${certificate.handle}&issuedDate=${dayjs(
              certificate.issuedAt,
            ).format(
              "YYYYMMDD",
            )}&filename=nationaal-watersportdiploma_nwd-${certificate.handle}-${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
            target="_blank"
          >
            <ArrowDownTrayIcon />
            <DropdownLabel>Download PDF</DropdownLabel>
          </DropdownItem>
          <DropdownItem
            href={`/diploma/${certificate.id}?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
            target="_blank"
          >
            <ArrowTopRightOnSquareIcon />
            <DropdownLabel>Online bekijken</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem onClick={() => setOpenDialog("withdraw-certificate")}>
            <TrashIcon />
            <DropdownLabel>Diploma verwijderen</DropdownLabel>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <WithdrawCertificateDialog
        certificateId={certificate.id}
        open={openDialog === "withdraw-certificate"}
        onClose={() => setOpenDialog(null)}
      />
    </>
  );
}
