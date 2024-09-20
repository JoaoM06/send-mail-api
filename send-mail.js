const express = require('express');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

async function sendMail(name, email, message) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.FROM_EMAIL,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken.token
            },
            logger: true,
            debug: true 
        });

        const mailOptions = {
            from: process.env.FROM_EMAIL,
            to: email, // Destinatário
            subject: 'Nova mensagem do formulário de contato',
            text: `Nome: ${name}\nE-mail: ${email}\nMensagem: ${message}`
        };

        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.error('Erro ao enviar o e-mail:', error);
        throw new Error('Falha no envio do e-mail');
    }
}

const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['api-key'];
    if (apiKey && apiKey === process.env.API_KEY) {
        next();
    } else {
        res.status(403).send('Chave de API inválida');
    }
};

const app = express();
app.use(express.json());

app.post('/send-mail', verifyApiKey, async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).send('Todos os campos são obrigatórios');
    }

    try {
        const result = await sendMail(name, email, message);
        res.status(200).send('E-mail enviado com sucesso!');
    } catch (error) {
        res.status(500).send('Erro ao enviar o e-mail');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});