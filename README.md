# MDNLocalDev

Proxy all the things! This helps developing [yari](https://github.com/mdn/yari/)
against the MDN staging (<https://developer.allizom.org/>) and
MDN (<https://developer.mozilla.org>).

## Setup

### mkcert
Install [mkcert](https://github.com/FiloSottile/mkcert) to enable seamless https.

```bash
mkcert -install
# if promted for
# Enter Password or Pin for "NSS Certificate DB":
# if you're using Firefox this requires your Firefox master password
mkcert localhost 127.0.0.1
mkdir ~/.mkcert
mv localhost+1* ~/.mkcert
```

### Front-End Configuration

Go into the front-end directory and run:

```bash
HTTPS=true SSL_CRT_FILE=~/.mkcert/localhost+1.pem SSL_KEY_FILE=~/.mkcert/localhost+1-key.pem yarn dev

```

- Acticate `MDNLocalDev` (click on the M logo in the toolbar so it turns black)
- Visit [MDN](https://developer.mozilla.org/) or [MDN staging](https://developer.allizom.org/)