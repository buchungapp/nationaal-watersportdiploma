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
  stepIndex,
}: {
  selectedCertificateTemplate: CertificateTemplate["id"] | null;
  setSelectedCertificateTemplate: (
    template: CertificateTemplate["id"] | null,
  ) => void;
  stepIndex: number;
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

  const hasQuery = templateQuery !== "";
  const templatesWithoutCategory = filteredTemplates.filter((x) => !x.category);

  return (
    <Fieldset>
      <Legend>{stepIndex}. Wat voor soort diploma is dit?</Legend>

      <Field>
        <Combobox
          value={selectedCertificateTemplate}
          setQuery={setTemplateQuery}
          onChange={(value) => setSelectedCertificateTemplate(value)}
          displayValue={(value) => {
            if (value === "other") return "Overig";

            const template = certificateTemplates.find(
              (template) => template.id === value,
            );

            if (!template) return "";
            return templateLabel(template);
          }}
        >
          {!hasQuery ? <OtherTemplateOption /> : null}
          {templatesWithoutCategory.map((template) => (
            <ComboboxOption key={template.id} value={template.id}>
              <ComboboxLabel>{templateLabel(template)}</ComboboxLabel>
            </ComboboxOption>
          ))}
          {!hasQuery || templatesWithoutCategory.length > 0 ? (
            <Divider className="mt-1 mb-2" />
          ) : null}
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
          {hasQuery ? <OtherTemplateOption /> : null}
        </Combobox>
      </Field>
    </Fieldset>
  );
}

function OtherTemplateOption() {
  return (
    <ComboboxOption value={"other"}>
      <ComboboxLabel>Overig</ComboboxLabel>
    </ComboboxOption>
  );
}
