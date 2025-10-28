import axios from "axios";
import crypto from "crypto";
import fs from "fs";

function rsaEncrypt(dataToEncrypt, publicKey) {
    let buffer = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(dataToEncrypt)
    );
    return buffer.toString('base64');
}

function aesEncrypt(dataToEncrypt, aesKey) {
    const key = Buffer.from(aesKey, 'utf8');
    const iv = Buffer.from(aesKey, 'utf8');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(dataToEncrypt, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

function aesDecrypt(dataToDecrypt, aesKey) {
    const key = Buffer.from(aesKey, 'utf8');
    const iv = Buffer.from(aesKey, 'utf8');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(dataToDecrypt, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

// const { data: { data: rpubk } } = await axios.get('https://ssfa.mycompapp.com/api/auth/rpubk?_allow_anonymous=true');
const rpubk = 'TUlHZk1BMEdDU3FHU0liM0RRRUJBUVVBQTRHTkFEQ0JpUUtCZ1FEVUhaOHdGc0RqY09IRDJSbVBvZ1prRFA2WAp6cHJseDI5M0NXN0VxaVQzaFErUzdyT3JJWC8zUGVCL3JyMFRwM1NjUi9tSENnY0YzZjJSSWRzbWN6V3FKbzZuClNrbEh2UjAxTEk0dm5iWVVBTUJ1TUJ6Nm9DbEhHc2UxZU1mVk5ySFl2aWlkd1NDL0dHZmR4ekVSNE5zbXNkRmkKRzd3bUV3Z01zd09NdXBHY2V3SURBUUFCCg=='
const publicKeyPkcs1 = "-----BEGIN PUBLIC KEY-----\n" + Buffer.from(rpubk, 'base64').toString('ascii') + "-----END PUBLIC KEY-----"

const aesKey = crypto.randomBytes(32).toString('ascii');
const rsaEncryptedAesKey = rsaEncrypt(aesKey, publicKeyPkcs1);

const fixtureBody = {
    "take": 20,
    "page": 1,
    "seasonID": 18,
    "competitionID": 20,
    "teamIds": [20529, 21305],
    "startDate": "2023-05-09",
}

const aesEncryptedFixtureBody = aesEncrypt(JSON.stringify(fixtureBody), aesKey)

const { data } = await axios.post('https://ssfa.mycompapp.com/api/fixture/public?_allow_anonymous=true', { encryption: aesEncryptedFixtureBody }, {
    headers: {
        'X-AK': rsaEncryptedAesKey,
        'X-DATE': "2023-05-09",
        'X-PORTAL': "Public",
        'X-PUBLIC-SEASON': "18",
        'X-REGISTER-SEASON': "18",
    }
});


const fixturesData = aesDecrypt(data.encryption, aesKey);
const fixturesDataString = JSON.stringify(fixturesData, null, 2);
console.log(fixturesDataString)

fs.writeFile("fixtures.json", fixturesDataString, (err) => {
    if (err) {
        console.log(err);
    }
});
