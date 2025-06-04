import { useState } from "react";
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

type ComboboxItem =
  | { type: "template"; template: CertificateTemplate }
  | { type: "category"; category: string }
  | { type: "divider"; id: string }
  | { type: "other" };

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

function buildComboboxItems(
  filteredTemplates: CertificateTemplate[],
  hasQuery: boolean,
): ComboboxItem[] {
  const items: ComboboxItem[] = [];

  // Add "other" option at the beginning if no query
  if (!hasQuery) {
    items.push({ type: "other" });
  }

  // Add templates without category
  const templatesWithoutCategory = filteredTemplates.filter((x) => !x.category);
  for (const template of templatesWithoutCategory) {
    items.push({ type: "template", template });
  }

  // Add divider if we have uncategorized templates and categorized ones
  if (!hasQuery || templatesWithoutCategory.length > 0) {
    const hasCategories = filteredTemplates.some((x) => x.category);
    if (hasCategories) {
      items.push({ type: "divider", id: "main-divider" });
    }
  }

  // Add categorized templates
  const categories = [
    ...new Set(
      filteredTemplates.map((template) => template.category).filter(Boolean),
    ),
  ] as string[];

  for (const [categoryIndex, category] of categories.entries()) {
    // Add category header
    items.push({ type: "category", category });

    // Add templates in this category
    for (const template of filteredTemplates.filter(
      (x) => x.category === category,
    )) {
      items.push({ type: "template", template });
    }

    // Add divider after category (except for the last one)
    if (categoryIndex < categories.length - 1) {
      items.push({ type: "divider", id: `category-divider-${categoryIndex}` });
    }
  }

  // Add "other" option at the end if there's a query
  if (hasQuery) {
    items.push({ type: "other" });
  }

  return items;
}

export function CertificateTemplatePicker({
  selectedCertificateTemplate,
  setSelectedCertificateTemplate,
  stepIndex,
}: {
  selectedCertificateTemplate: CertificateTemplate | null;
  setSelectedCertificateTemplate: (
    template: CertificateTemplate | null,
  ) => void;
  stepIndex: number;
}) {
  const [templateQuery, setTemplateQuery] = useState("");

  const filteredTemplates = filterTemplates(
    certificateTemplates,
    templateQuery,
  );

  const hasQuery = templateQuery !== "";
  const comboboxItems = buildComboboxItems(filteredTemplates, hasQuery);

  // Find the ComboboxItem that corresponds to the selected template
  const selectedItem = selectedCertificateTemplate
    ? comboboxItems.find(
        (item) =>
          item.type === "template" &&
          item.template.id === selectedCertificateTemplate.id,
      )
    : null;

  return (
    <Fieldset>
      <Legend>{stepIndex}. Wat voor soort diploma is dit?</Legend>

      <Field>
        <Combobox
          options={comboboxItems}
          value={selectedItem}
          setQuery={setTemplateQuery}
          onChange={(item) => {
            if (!item) {
              setSelectedCertificateTemplate(null);
            } else if (item.type === "template") {
              setSelectedCertificateTemplate(item.template);
            } else if (item.type === "other") {
              setSelectedCertificateTemplate({
                id: "other",
                issuingAuthority: "",
              });
            }
            // Ignore category headers and dividers
          }}
          displayValue={(item) => {
            if (!item) return "";
            if (item.type === "template") {
              return templateLabel(item.template);
            }
            if (item.type === "other") {
              return "Overig";
            }
            return "";
          }}
        >
          {(item) => {
            if (item.type === "template") {
              return (
                <ComboboxOption value={item}>
                  <ComboboxLabel>{templateLabel(item.template)}</ComboboxLabel>
                </ComboboxOption>
              );
            }

            if (item.type === "other") {
              return (
                <ComboboxOption value={item}>
                  <ComboboxLabel>Overig</ComboboxLabel>
                </ComboboxOption>
              );
            }

            if (item.type === "category") {
              return (
                <div>
                  <p className="mb-1 ml-2 font-semibold text-zinc-500 text-xs uppercase">
                    {item.category}
                  </p>
                </div>
              );
            }

            if (item.type === "divider") {
              return (
                <div>
                  <Divider className="mt-1 mb-2" />
                </div>
              );
            }

            // This should never happen, but return a div to satisfy TypeScript
            return <div />;
          }}
        </Combobox>
      </Field>
    </Fieldset>
  );
}
