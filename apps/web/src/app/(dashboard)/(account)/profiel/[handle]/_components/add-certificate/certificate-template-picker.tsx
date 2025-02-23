import { Fragment, useState } from "react";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  Field,
  Fieldset,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import {
  type CertificateTemplate,
  certificateTemplates,
} from "./certificate-templates";

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
      template.category?.toLowerCase().includes(lowerCaseQuery) ||
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

export function CertificateTemplatePicker({
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
  const categories = [
    ...new Set(
      filteredTemplates.map((template) => template.category).filter(Boolean),
    ),
  ] as string[];

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
          {filteredTemplates
            .filter((x) => !x.category)
            .map((template) => (
              <ComboboxOption key={template.id} value={template.id}>
                <ComboboxLabel>{templateLabel(template)}</ComboboxLabel>
              </ComboboxOption>
            ))}
          <Divider className="mt-1 mb-2" />
          {categories.map((category) => (
            <Fragment key={category}>
              <p className="ml-2 font-semibold text-xs text-zinc-500 mb-1 uppercase">
                {category}
              </p>
              {filteredTemplates
                .filter((x) => x.category === category)
                .map((template) => (
                  <ComboboxOption key={template.id} value={template.id}>
                    <ComboboxLabel>{templateLabel(template)}</ComboboxLabel>
                  </ComboboxOption>
                ))}
              <Divider className="mt-1 mb-2 last:hidden" />
            </Fragment>
          ))}
        </Combobox>
      </Field>
    </Fieldset>
  );
}
