import tiktoken

# Initialize the tokenizer (using OpenAI's default model tokenizer)
tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")

# Sample text
text = """{
  "personalInformation": {
    "name": "BRUNO LABEAU",
    "email": "bruno.labeau@wanadoo.fr",
    "phone": "06 - 18 - 99 - 83 - 68",
    "location": null
  },
  "summary": "COMPTABLE EXPERIMENTE",
  "workExperience": [
    {
      "title": "Comptable Fournisseurs",
      "company": "SA Pétrochimie Grossiste électro-ménager/Plomberie sanitaire",
      "startDate": "2002-09",
      "endDate": "2012-07",
      "responsibilities": [
        "Suivi fournisseurs : Factures, règlements, litiges...",
        "Gestion frais généraux, comptabilité analytique",
        "Préparation du bilan, situations financières..."
      ]
    },
    {
      "title": "Comptable Fournisseurs",
      "company": "Sietra Provence : Equipement thermique, climatisation",
      "startDate": "1999-10",
      "endDate": "2002-04",
      "responsibilities": [
        "Vérification et comptabilisation factures fournisseurs",
        "Gestion des stocks, pointage du personnel, suivi des sous-traitants",
        "Comptabilité analytique"
      ]
    },
    {
      "title": "Comptable + Marketing",
      "company": "Société de Promotion du Mas des Mûriers : Domaine viticole",
      "startDate": "1996-09",
      "endDate": "1999-09",
      "responsibilities": [
        "Comptabilité Clients et fournisseurs",
        "Comptabilité analytique",
        "Préparation bilan, création fichier clientèle, Mailings, Secrétariat"
      ]
    },
    {
      "title": "Comptable",
      "company": "Service Marée : Grossiste poissonnerie",
      "startDate": "1994-06",
      "endDate": "1995-12",
      "responsibilities": [
        "Vérification et comptabilisation factures fournisseurs",
        "Suivi bancaire et trésorerie",
        "Payes",
        "Obligations sociales, fiscales et administratives"
      ]
    },
    {
      "title": "Comptable",
      "company": null,
      "startDate": "1996-01",
      "endDate": "1996-09",
      "responsibilities": [
        "Vérification et comptabilisation factures fournisseurs",
        "Suivi bancaire et trésorerie"
      ]
    }
  ],
  "education": [
    {
      "degree": "GRETA Stage Bureautique Informatique et Communication",
      "institution": null,
      "graduationDate": "1996",
      "fieldOfStudy": "Bureautique Informatique et Communication"
    },
    {
      "degree": "Niveau DECF",
      "institution": null,
      "graduationDate": "1992",
      "fieldOfStudy": "Diplôme Etudes Comptables Finance"
    },
    {
      "degree": "DUT G.E.A",
      "institution": null,
      "graduationDate": "1990",
      "fieldOfStudy": "Gestion Entreprises et Administrations"
    },
    {
      "degree": "Bac G2",
      "institution": null,
      "graduationDate": "1988",
      "fieldOfStudy": "Comptabilité"
    },
    {
      "degree": "CAP + BEP Comptabilité",
      "institution": null,
      "graduationDate": "1986",
      "fieldOfStudy": "Comptabilité"
    }
  ],
  "skills": [
    "Comptabilité fournisseurs",
    "Comptabilité analytique",
    "Préparation de bilan",
    "Gestion des stocks",
    "Comptabilité clients",
    "Paie",
    "Obligations sociales, fiscales et administratives",
    "Word",
    "Excel",
    "Saari : Ordicompta, paye et ventes",
    "Sybel compta",
    "EBP",
    "Logiciels spécifiques",
    "Anglais : Notions scolaires"
  ],
  "additionalSections": {
    "centresDInteret": [
      "Réseaux sociaux",
      "Environnement / Ecologie",
      "Musique",
      "Lecture",
      "Reportages Télé"
    ],
    "benevolat": {
      "capacitesRedactionnelles": [
        "Rédaction périodique d'une News letter",
        "Tenue d'un blog",
        "Ecriture de chansons",
        "Tenue quotidienne des pages artistes et Facebook",
        "Rédaction de tracts, comptes-rendus de réunion, communiqués de presse",
        "Contacts avec les institutions et les collectivités",
        "Gestion des réseaux sociaux"
      ],
      "capacitesOrganisationnelles": [
        "Organisation et gestions d'interviews presse et radio",
        "Organisation de deux concerts sur Paris",
        "Gestion de la communication : fabrication cartes pro, flyers, pancartes, magnets, ou autres goodies promotionnels",
        "Organisation d'une journée citoyenne (stands, infirmation, interventions, concert...)",
        "Organisation d'une soirée d'information",
        "Rédaction et actualisation d'un plan de financement pour une société technologique"
      ]
    }
  }
}"""

# Tokenize the text and count tokens
tokens = tokenizer.encode(text)
token_count = len(tokens)

print(f"Token Count: {token_count}")
