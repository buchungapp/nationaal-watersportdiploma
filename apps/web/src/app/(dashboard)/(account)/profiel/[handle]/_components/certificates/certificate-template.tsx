import { useState } from "react";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
import {
  Field,
  Fieldset,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";

export type CertificateTemplate = {
  id: string;
  additionalSearchTag?: string;
} & (
  | {
      issuingAuthority?: never;
      title: string;
    }
  | {
      issuingAuthority: string;
      title?: never;
    }
  | {
      issuingAuthority: string;
      title: string;
    }
);

export const certificateTemplates: CertificateTemplate[] = [
  // TODO: add all certificates related to watersports

  {
    id: "cwo",
    issuingAuthority: "CWO",
  },
  {
    id: "cwo-zwaardboot-1mans-jeugd-basis",
    issuingAuthority: "CWO",
    title: "Zwaardboot 1mans Jeugd Basis (I)",
  },
  // TODO: add all CWO certificates

  {
    id: "cbr-klein-vaarbewijs-1",
    issuingAuthority: "CBR",
    title: "Klein Vaarbewijs I",
  },
  {
    id: "cbr-klein-vaarbewijs-2",
    issuingAuthority: "CBR",
    title: "Klein Vaarbewijs II",
  },
  {
    id: "cbr-groot-plezier-vaarbewijs-2",
    issuingAuthority: "CBR",
    title: "Groot Pleziervaarbewijs II",
  },
  // TODO: add all vaarbewijs certificates

  // Marifoon from: https://www.rdi.nl/onderwerpen/marifoons-en-overige-maritieme-communicatieapparatuur/examen-en-bedieningscertificaten
  {
    id: "cbr-basis-certificaat-marifonie",
    issuingAuthority: "CBR",
    title: "Basis Certificaat Marifonie",
  },
  {
    id: "cbr-marcom-b",
    issuingAuthority: "CBR",
    title: "Beperkt Certificaat Maritieme Radiocommunicatie (Marcom-B)",
  },
  {
    id: "cbr-marcom-a",
    issuingAuthority: "CBR",
    title: "Algemeen Certificaat Maritieme Radiocommunicatie (Marcom-A)",
  },

  // All EHBO from: https://www.rijksoverheid.nl/documenten/regelingen/2017/09/19/lijst-certificaten-kinder-ehbo
  {
    id: "orangje-kruis-eerste-hulp-aan-kinderen",
    issuingAuthority: "Het Oranje Kruis",
    title: "Eerste Hulp aan Kinderen",
    additionalSearchTag: "EHBO",
  },
  {
    id: "orangje-kruis-eerste-hulp",
    issuingAuthority: "Het Oranje Kruis",
    title: "Eerste Hulp",
    additionalSearchTag: "EHBO",
  },
  {
    id: "nedcert-sehso",
    issuingAuthority: "NedCert",
    title: "Spoedeisende Hulpverlening bij Slachtoffers (SEHSO)",
    additionalSearchTag: "EHBO",
  },
  {
    id: "nikta-acute-zorg-kinderen",
    issuingAuthority: "NIKTA",
    title: "Acute Zorg bij kinderen",
    additionalSearchTag: "EHBO",
  },
  {
    id: "nikta-bedrijfshulpverlener-kind-omgeving",
    issuingAuthority: "NIKTA",
    title: "Bedrijfshulpverlener Module Kind en Omgeving",
    additionalSearchTag: "EHBO",
  },
  {
    id: "nikta-acute-zorgverlener-kind-omgeving",
    issuingAuthority: "NIKTA",
    title: "Acute Zorgverlener Module Kind en Omgeving",
    additionalSearchTag: "EHBO",
  },
  {
    id: "nikta-eerstehulpverlener-medic-fire",
    issuingAuthority: "NIKTA",
    title: "Eerstehulpverlener Medic & Fire First Aid ® Europe Course",
    additionalSearchTag: "EHBO",
  },
  {
    id: "nedcert-sehbk",
    issuingAuthority: "NedCert",
    title: "Spoedeisende Hulpverlening bij Kinderen (SEHBK)",
    additionalSearchTag: "EHBO",
  },
  {
    id: "nvb-acute-zorg-kind-omgeving",
    issuingAuthority: "Nederlandse Vereniging Bedrijfshulpverlening",
    title: "Acute Zorg aan Kind en Omgeving",
    additionalSearchTag: "EHBO",
  },
  {
    id: "lpev-basis-eerstehulpverlener",
    issuingAuthority: "Stichting LPEV",
    title:
      "Basis Eerstehulpverlener-LPEV met de aantekening Eerste hulp aan Kinderen",
    additionalSearchTag: "EHBO",
  },
  {
    id: "rode-kruis-eerste-hulp-babys-kinderen",
    issuingAuthority: "Nederlandse Rode Kruis",
    title: "Eerste Hulp aan Baby's en Kinderen",
    additionalSearchTag: "EHBO",
  },
  {
    id: "nib-eerste-hulp-werken-met-kinderen",
    issuingAuthority: "Nederlands Instituut voor Bedrijfshulpverlening",
    title: "Eerste Hulp bij werken met kinderen",
    additionalSearchTag: "EHBO",
  },
  {
    id: "cibot-amr3-ehak-ikk",
    issuingAuthority: "CIBOT",
    title:
      "Advanced Medical Responder: Eerste hulp Aan Kinderen (AMR3: EHAK IKK)",
    additionalSearchTag: "EHBO",
  },
  {
    id: "cibot-bedrijfshulpverlening-kind",
    issuingAuthority: "CIBOT",
    title: "Bedrijfshulpverlening Kind",
    additionalSearchTag: "EHBO",
  },
  {
    id: "livis-eerste-hulp-onderwijs-babys-kinderen",
    issuingAuthority: "Livis",
    title: "Eerste Hulp Bij Ongelukken onderwijs voor baby's en kinderen",
    additionalSearchTag: "EHBO",
  },
];

function filterTemplates(
  templates: CertificateTemplate[],
  query: string,
): CertificateTemplate[] {
  return templates.filter((template) => {
    const lowerCaseQuery = query.toLowerCase();
    return (
      template.id.toLowerCase().includes(lowerCaseQuery) ||
      template.title?.toLowerCase().includes(lowerCaseQuery) ||
      template.issuingAuthority?.toLowerCase().includes(lowerCaseQuery) ||
      template.additionalSearchTag?.toLowerCase().includes(lowerCaseQuery)
    );
  });
}

function templateLabel(template: CertificateTemplate) {
  if (template.issuingAuthority && template.title) {
    return `${template.title} (${template.issuingAuthority})`;
  }

  if (template.issuingAuthority) {
    return template.issuingAuthority;
  }

  if (template.title) {
    return template.title;
  }

  return "";
}

export function CertificateTemplate({
  selectedCertificateTemplate,
  setSelectedCertificateTemplate,
}: {
  selectedCertificateTemplate: CertificateTemplate["id"] | null;
  setSelectedCertificateTemplate: (
    template: CertificateTemplate["id"] | null,
  ) => void;
}) {
  const [templateQuery, setTemplateQuery] = useState("");

  const filteredTemplates = filterTemplates(
    certificateTemplates,
    templateQuery,
  );

  return (
    <Fieldset>
      <Legend>2. Wat voor soort diploma is dit?</Legend>

      <Field>
        <Combobox
          value={selectedCertificateTemplate}
          setQuery={setTemplateQuery}
          onChange={(value) => setSelectedCertificateTemplate(value)}
          displayValue={(value) => {
            if (value === "other") return "Anders";

            const template = certificateTemplates.find(
              (template) => template.id === value,
            );

            if (!template) return "";
            return templateLabel(template);
          }}
        >
          <ComboboxOption value={"other"}>
            <ComboboxLabel>Anders</ComboboxLabel>
          </ComboboxOption>
          {filteredTemplates.map((template) => (
            <ComboboxOption key={template.id} value={template.id}>
              <ComboboxLabel>{templateLabel(template)}</ComboboxLabel>
            </ComboboxOption>
          ))}
        </Combobox>
      </Field>
    </Fieldset>
  );
}
