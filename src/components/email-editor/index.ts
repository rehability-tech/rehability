export { default } from "./EmailEditor";
export type { EmailEditorHandle, EmailEditorProps } from "./EmailEditor";
export { generateEmailHtml } from "./emailHtmlRenderer";
export type { EmailRenderContext } from "./emailHtmlRenderer";
export type { EmailSection, SectionType } from "./lib/sections";
export type { TripContext } from "./lib/types";
export {
  createDefaultSections,
  migrateToSections,
  aiToSections,
  sectionsToLegacy,
} from "./lib/sections";
