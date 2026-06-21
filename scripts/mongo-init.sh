#!/bin/bash
# Importé automatiquement par MongoDB au 1er démarrage du conteneur.
# Les fichiers JSON doivent être dans /seed-output/ (monté via docker-compose).
# FORMAT : "fichier.json:nom_collection_mongoose"
# Les noms de collections Mongoose sont toujours en minuscules (auto-générés).

DB="shape_db"
DIR="/seed-output"

# fichier JSON : collection Mongoose (minuscules = ce que lit le backend)
declare -A MAP=(
  [users]="users"
  [skills]="skills"
  [careers]="careers"
  [jobOfferModels]="joboffermodels"
  [trainings]="trainings"
  [quizzes]="quizzes"
  [textBlocs]="textblocs"
  [videos]="videoyoutubes"
  [jobOffers]="joboffers"
  [jobOfferApplications]="jobofferapplications"
  [interviews]="interviews"
  [tasks]="tasks"
  [inscriptions]="inscriptions"
  [conversations]="conversations"
  [messages]="messages"
  [notifications]="notifications"
  [notificationSettings]="notificationsettings"
  [mentorEvaluations]="mentorevaluations"
  [trainingRequests]="trainingrequests"
  [companyTrainingProposals]="companytrainingproposals"
  [documentations]="documentations"
)

echo "🌱 Import seed data dans $DB..."

for file_key in "${!MAP[@]}"; do
  col="${MAP[$file_key]}"
  FILE="$DIR/$file_key.json"
  if [ -f "$FILE" ]; then
    mongoimport --db "$DB" --collection "$col" --file "$FILE" --jsonArray --quiet
    echo "  ✅ $file_key.json → $col"
  else
    echo "  ⚠️  $file_key.json introuvable, ignoré"
  fi
done

echo "🎉 Import terminé"
