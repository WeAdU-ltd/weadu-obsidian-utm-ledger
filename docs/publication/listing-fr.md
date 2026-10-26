# Textes de présentation (français)

## Nom

WeAdU UTM Ledger

## Description courte

Crée des URL de campagne, signale les liens de campagne dont utm_source, utm_medium ou utm_campaign est absent, en double ou vide, et tient un registre en Markdown. Tout reste en local.

## Description longue

WeAdU UTM Ledger aide à créer et à vérifier des URL de campagne sans quitter ses notes.

- Insert campaign URL (insérer une URL de campagne) : saisissez l'URL de destination, la source, le support (medium), la campagne et, si besoin, le contenu et le terme. L'URL est insérée à l'emplacement du curseur.
- Registre : chaque URL créée peut être ajoutée, avec la date, comme ligne d'un tableau « UTM ledger » à la fin de la note en cours. Seules les nouvelles lignes sont ajoutées, le reste de la note n'est pas réécrit, et une URL déjà présente dans le registre n'est pas ajoutée une seconde fois.
- Check campaign links in the current note (vérifier les liens de campagne) : examine les liens qui portent des paramètres utm_ et liste, avec leur numéro de ligne, uniquement ceux dont utm_source, utm_medium ou utm_campaign est absent, en double ou vide, dont une valeur dépasse 80 caractères, ou dont une valeur n'est pas en minuscules. Le résultat s'ouvre dans une fenêtre ; la note n'est pas modifiée.
- Valeurs par défaut : une source, un support et une campagne par défaut peuvent être enregistrés dans les réglages.

Les valeurs sont enregistrées en minuscules, et un avis montre le changement si vous avez tapé des capitales. Elles peuvent contenir des lettres, des chiffres et . _ ~ -, sans espace, jusqu'à 80 caractères. Les clics Google Ads se suivent par le marquage automatique (gclid) et un modèle de suivi, pas par des UTM collés sur l'URL finale. Les paramètres UTM existants sont remplacés ; les autres paramètres sont conservés.

Le plugin n'effectue aucune requête réseau et ne collecte aucune donnée d'usage. Gratuit et open source (licence MIT), conçu par WeAdU.

Note : l'interface du plugin est en anglais.
