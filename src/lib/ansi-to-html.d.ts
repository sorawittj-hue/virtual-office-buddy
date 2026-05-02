declare module "ansi-to-html" {
  export default class Convert {
    constructor(options?: { newline?: boolean; escapeXML?: boolean });
    toHtml(input: string): string;
  }
}
