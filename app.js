// Importez les bibliothèques nécessaires
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');


const app = express();


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'malick',
});


connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
        return;
    }
    console.log('Connecté à la base de données MySQL.');
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route pour le service principal
app.get('/dayfinder', (req, res) => {
    const { date } = req.query;
    const formattedDate = formatDate(date);
    const dayOfWeek = getDayOfWeek(formattedDate);

    
    saveSearchHistory(formattedDate, dayOfWeek);

    const response = {
        date: formattedDate,
        dayOfWeek: dayOfWeek,
    };
    res.json(response);
});


app.get('/dayfinder/historique', (req, res) => {
    // Récupérez l'historique depuis la base de données
    getSearchHistory((err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération de l\'historique :', err);
            res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique.' });
            return;
        }
        res.json(results);
    });
});


function formatDate(date) {
    const [day, month, year] = date.split('-');
    return `${day}/${month}/${year}`;
}

// Fonction utilitaire pour obtenir le jour de la semaine correspondant à une date
function getDayOfWeek(date) {
    const dayOfWeek = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' });
    return capitalizeFirstLetter(dayOfWeek);
}

// Fonction utilitaire pour mettre en majuscule la première lettre d'une chaîne de caractères
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Fonction pour enregistrer l'historique dans la base de données
function saveSearchHistory(date, dayOfWeek) {
    const query = `INSERT INTO search_history (search_date, request, response)
                 VALUES (NOW(), ?, ?)`;

    connection.query(query, [date, dayOfWeek], (err) => {
        if (err) {
            console.error('Erreur lors de l\'enregistrement de l\'historique :', err);
        }
    });
}

// Fonction pour récupérer l'historique depuis la base de données
function getSearchHistory(callback) {
    const query = `SELECT id, search_date, request, response
                 FROM search_history
                 ORDER BY search_date DESC`;

    connection.query(query, (err, results) => {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, results);
    });
}

// Port d'écoute du serveur
const port = 8080;

// Lancez le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});
