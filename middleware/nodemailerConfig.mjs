// nodemailerConfig.mjs
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'vibehub.tp@gmail.com',  
        pass: 'ikvr aznd enap dqbe',   
    },
});

export default transporter;

