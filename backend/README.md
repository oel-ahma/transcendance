# FT_Transcendance backend
## Par tbelhomm

### Installation
---

Permets d'allumer la base de donnée:
```
sudo docker compose up -d
```

Permets d'installer les dépendances:
```bash
npm install
```

Copier-coller le `.env.example` en `.env` et modifier son contenu.
Par défaut, la base de donnée `postgresql://transcendance:strong-password@localhost:5432/transcendance?schema=public`

Permets de mettre la base de donnée à jour:
```bash
npx prisma generate
npx prisma db push
```

Permets de démarrer le serveur:
```
npm run start:dev
```

Pour voir la documentation de l'API:
http://localhost:3000/api/

Permets de voir le contenu de la base de donnée:
```
npx prisma studio
```

### Documentation
---

Nous sommes basés sur [Socket.IO V4](https://socket.io/docs/v4/). Consultez la documentation ou les exemples fournis avant de modifier ou de consulter cette partie.

Les websockets se séparent en 3 parties distinct:
 1. Les statuts de ses amis
 2. Les channels + messages
 3. Les salons de jeux

Un exemple est fourni sur ce JS: https://github.com/restray/ft_transcendance/blob/documentation/index.js

#### Se connecter aux websockets

Les 3 websockets se connectent **après la connexion d'un utilisateur**.

Il faut les démarrer comme suivi:
```js
/**
 * @var string BearerToken -> Représente le JWT de l'utilisateur
 * @var string namespace -> Correspond à friends, channels ou games
 * @return sock -> La variable socket io
 */
const sock = io(`ws://localhost:3000/${namespace}`, { auth: { token: BearerToken }})

friends.on('connect_error', (err) => {
  console.error(err);
});
friends.on('connect_failed', (err) => {
  console.error(err);
});

friends.on("connect", () => {
  console.info("Socket is connected!")
});
```

#### Evenements

---
Pour la socket `friends`
|Event|Paramêtres|Description|
|---|---|---|
|status|userId, Status(ONLINE, AWAY, PLAYING, OFFLINE)|Lorsque le statut d'un ami est mis à jour|
|new|`{id:`id de l'utilisateur`, name:`Nom de l'utilisateur`, avatar:`Avatar de l'utilisateur`, status:`Status de l'utilisateur`}`|Lorsque l'utilisateur a un nouvel ami|
|delete|`{id:`id de l'utilisateur`}`|Lorsqu'un utilisateur supprime ou se fait supprimer|
