#!/bin/bash
# Importé automatiquement par MongoDB au 1er démarrage du conteneur.
# Les fichiers JSON doivent être dans /seed-output/ (monté via docker-compose).

DB="shape_db"
DIR="/seed-output"

COLLECTIONS=(
  users
  skills
  careers
  jobOfferModels
  trainings
  quizzes
  textBlocs
  videos
  jobOffers
  jobOfferApplications
  interviews
  tasks
  inscriptions
  conversations
  messages
  notifications
  notificationSettings
  mentorEvaluations
  trainingRequests
  companyTrainingProposals
  documentations
)

echo "🌱 Import seed data dans $DB..."

for col in "${COLLECTIONS[@]}"; do
  FILE="$DIR/$col.json"
  if [ -f "$FILE" ]; then
    mongoimport --db "$DB" --collection "$col" --file "$FILE" --jsonArray --quiet
    echo "  ✅ $col"
  else
    echo "  ⚠️  $col — fichier introuvable ($FILE), ignoré"
  fi
done

echo "🎉 Import terminé"
