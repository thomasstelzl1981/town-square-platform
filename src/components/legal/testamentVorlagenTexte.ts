/**
 * Testament-Vorlagentexte — SSOT für Inline-Anzeige + PDF
 * 4 Varianten: Alleinerbe, Mehrere Erben, Vor-/Nacherbschaft, Berliner Testament
 */

export interface TestamentParagraph {
  title: string;
  lines: string[];
}

export interface TestamentVorlage {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  intro: string[];
  paragraphs: TestamentParagraph[];
  signatureNote: string;
}

export const TESTAMENT_VORLAGEN: TestamentVorlage[] = [
  {
    id: 1,
    title: 'Alleinerbe',
    subtitle: 'Einzeltestament mit Ersatzerbe',
    icon: '📄',
    intro: [
      'Ich,',
      '________________________________________ (Name, vollständig)',
      'geboren am ____________________________',
      'wohnhaft ______________________________',
      '',
      'errichte hiermit mein Testament und bestimme für den Fall meines Todes:',
    ],
    paragraphs: [
      {
        title: '§ 1 Widerruf',
        lines: [
          'Ich widerrufe alle früher von mir errichteten Testamente und sonstigen letztwilligen Verfügungen.',
        ],
      },
      {
        title: '§ 2 Alleinerbe',
        lines: [
          'Zu meinem alleinigen und unbeschränkten Erben setze ich ein:',
          '________________________________________ (Name, vollständig)',
          'geboren am ____________________________',
          'wohnhaft ______________________________',
        ],
      },
      {
        title: '§ 3 Ausschluss sonstiger Erben',
        lines: [
          'Alle Personen, die nach der gesetzlichen Erbfolge als Erben in Betracht kämen und die ich vorstehend nicht als Erben eingesetzt habe, schließe ich hiermit ausdrücklich von der Erbfolge aus.',
        ],
      },
      {
        title: '§ 4 Ersatzerbe',
        lines: [
          'Sollte der vorgenannte Erbe vor mir versterben oder die Erbschaft ausschlagen, so setze ich als Ersatzerben ein:',
          '________________________________________ (Name, vollständig)',
          'geboren am ____________________________',
          'wohnhaft ______________________________',
        ],
      },
      {
        title: '§ 5 Schlussbestimmung',
        lines: [
          'Dieses Testament gilt für mein gesamtes gegenwärtiges und zukünftiges Vermögen, gleich welcher Art und an welchem Ort es sich befindet.',
        ],
      },
    ],
    signatureNote: 'Ort, Datum: __________________, den ______________\n\n(Eigenhändige Unterschrift)',
  },
  {
    id: 2,
    title: 'Mehrere Erben',
    subtitle: 'Einzeltestament mit Quoten',
    icon: '📄',
    intro: [
      'Ich,',
      '________________________________________ (Name, vollständig)',
      'geboren am ____________________________',
      'wohnhaft ______________________________',
      '',
      'errichte hiermit mein Testament und bestimme für den Fall meines Todes:',
    ],
    paragraphs: [
      {
        title: '§ 1 Widerruf',
        lines: [
          'Ich widerrufe alle früher von mir errichteten Testamente und sonstigen letztwilligen Verfügungen.',
        ],
      },
      {
        title: '§ 2 Erbeinsetzung (Erben nach Bruchteilen)',
        lines: [
          'Zu meinen Erben setze ich ein:',
          '1) ______________________________________ zu einem Anteil von ______',
          '2) ______________________________________ zu einem Anteil von ______',
          '3) ______________________________________ zu einem Anteil von ______',
          '(weitere Erben nach Bedarf ergänzen)',
        ],
      },
      {
        title: '§ 3 Ersatz- und Anwachsungsregelung',
        lines: [
          '(1) Sollte einer der eingesetzten Erben vor mir versterben oder die Erbschaft ausschlagen, treten dessen Abkömmlinge nach den gesetzlichen Vorschriften an dessen Stelle.',
          '(2) Sind keine Abkömmlinge vorhanden, wächst der freiwerdende Erbteil den übrigen Erben im Verhältnis ihrer Erbquoten an.',
        ],
      },
      {
        title: '§ 4 Teilungsanordnung (optional)',
        lines: [
          '(Nur ausfüllen, wenn gewollt — z.B.: „Die Immobilie [Bezeichnung/Adresse] soll im Innenverhältnis auf [Name] fallen; Ausgleichung erfolgt durch …")',
          '________________________________________________________________________',
          '________________________________________________________________________',
        ],
      },
      {
        title: '§ 5 Schlussbestimmung',
        lines: [
          'Dieses Testament gilt für mein gesamtes gegenwärtiges und zukünftiges Vermögen.',
        ],
      },
    ],
    signatureNote: 'Ort, Datum: __________________, den ______________\n\n(Eigenhändige Unterschrift)',
  },
  {
    id: 3,
    title: 'Vor-/Nacherbschaft',
    subtitle: 'Vor- und Nacherbschaft',
    icon: '📄',
    intro: [
      'Ich,',
      '________________________________________ (Name, vollständig)',
      'geboren am ____________________________',
      'wohnhaft ______________________________',
      '',
      'errichte hiermit mein Testament und bestimme für den Fall meines Todes:',
    ],
    paragraphs: [
      {
        title: '§ 1 Widerruf',
        lines: [
          'Ich widerrufe alle früher von mir errichteten Testamente und sonstigen letztwilligen Verfügungen.',
        ],
      },
      {
        title: '§ 2 Vorerbe',
        lines: [
          'Ich setze als Vorerben ein:',
          '________________________________________ (Name, vollständig)',
          'geboren am ____________________________',
          'wohnhaft ______________________________',
        ],
      },
      {
        title: '§ 3 Nacherbe',
        lines: [
          'Als Nacherben bestimme ich:',
          '________________________________________ (Name, vollständig)',
          'geboren am ____________________________',
          'wohnhaft ______________________________',
          '',
          'Die Nacherbfolge soll eintreten mit dem Tod des Vorerben.',
        ],
      },
      {
        title: '§ 4 Anordnung zur Verfügungsmacht',
        lines: [
          'Der Vorerbe ist nicht berechtigt, Nachlassgegenstände unentgeltlich zu übertragen oder durch Schenkung zu mindern. (Soweit gesetzlich zulässig.)',
        ],
      },
      {
        title: '§ 5 Schlussbestimmung',
        lines: [
          'Dieses Testament gilt für mein gesamtes gegenwärtiges und zukünftiges Vermögen.',
        ],
      },
    ],
    signatureNote: 'Ort, Datum: __________________, den ______________\n\n(Eigenhändige Unterschrift)',
  },
  {
    id: 4,
    title: 'Berliner Testament',
    subtitle: 'Ehegatten / Lebenspartner',
    icon: '📄',
    intro: [
      'Wir, die Eheleute / eingetragenen Lebenspartner',
      '',
      '________________________________________ (Partner 1 — Name, vollständig)',
      'geboren am ____________________________',
      'wohnhaft ______________________________',
      '',
      'und',
      '',
      '________________________________________ (Partner 2 — Name, vollständig)',
      'geboren am ____________________________',
      'wohnhaft ______________________________',
      '',
      'errichten hiermit folgendes gemeinschaftliches Testament:',
    ],
    paragraphs: [
      {
        title: '§ 1 Widerruf',
        lines: [
          'Wir widerrufen alle früher von uns errichteten Testamente und sonstigen letztwilligen Verfügungen.',
        ],
      },
      {
        title: '§ 2 Gegenseitige Alleinerbeneinsetzung',
        lines: [
          'Wir setzen uns hiermit gegenseitig zu alleinigen Erben des zuerst von uns Versterbenden ein.',
        ],
      },
      {
        title: '§ 3 Schlusserben',
        lines: [
          'Schlusserben des Letztversterbenden von uns sind unsere Abkömmlinge:',
          '1) ______________________________________, geboren am ______________',
          '2) ______________________________________, geboren am ______________',
          '(weitere nach Bedarf ergänzen)',
          'zu gleichen Teilen.',
          '',
          'Verstirbt ein Abkömmling vor dem Letztversterbenden, treten dessen Abkömmlinge nach den gesetzlichen Vorschriften an seine Stelle.',
        ],
      },
      {
        title: '§ 4 Pflichtteilsstrafklausel',
        lines: [
          'Verlangt ein Abkömmling nach dem Tod des Erstversterbenden den Pflichtteil oder macht Pflichtteils- bzw. Pflichtteilsergänzungsansprüche geltend, so soll dieser Abkömmling auch nach dem Tod des Letztversterbenden lediglich den Pflichtteil erhalten.',
        ],
      },
      {
        title: '§ 5 Wechselbezüglichkeit und Bindungswirkung',
        lines: [
          'Die vorstehenden Verfügungen sind wechselbezüglich. Nach dem Tod des Erstversterbenden ist der Überlebende an die wechselbezüglichen Verfügungen gebunden, soweit gesetzlich vorgesehen.',
        ],
      },
      {
        title: '§ 6 Schlussbestimmung',
        lines: [
          'Dieses Testament gilt für unser gesamtes Vermögen.',
        ],
      },
    ],
    signatureNote: 'Ort, Datum: __________________, den ______________\n\n(Unterschrift Partner 1)\n__________________________\n\n(Unterschrift Partner 2 — Zustimmungsvermerk empfohlen)\n„Ich schließe mich den vorstehenden Verfügungen an."\n__________________________',
  },
];
