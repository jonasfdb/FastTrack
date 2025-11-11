## 📦 About This Repository

FastTrack is a small and efficient Discord bot that tracks time trials in Mario Kart 8 Deluxe through Discord. You can have a fun competition with your friends this way!

## 🤝 Contributing & Roadmap

For ideas, suggestions or feature request, feel free to contact me through any of the means I offer, preferably Discord. To submit code, just do it the standard way through a request, ideally with a nice commit message. There's no specific code guidelines to adhere to, I don't always adhere to them either.

In the future, I plan on adding more games and more social-ish features to FastTrack. Maybe, if I get the chance, I can even have it interact with the MKCentral API, if they have one. There's definitely room for improvement as well in the bot, and I do intend to improve it.

## ⚙️ Requirements & Setup

### Prerequisites

You should have a Discord bot token available through your [Discord Developer Portal](https://discord.com/developers), and have [Node.js](https://nodejs.org) >22 installed. This version of FastTrack was built and is running on Node.js 22.21.0 using discord.js 14.24.0. Data storage is done through SQLite, which the NPM package fully supports.

### Installation and Setup

Clone the repository into a new folder and run `npm install` to install the necessary packages. Then, create a `.env` file based on the structure in `.env.example` at `/config`, where `.env.example` is. Fill it with the values needed, and run the start script down below.

### Run

FastTrack provides the following executable scripts through `package.json`:

```bash
npm start               # run compiled build using tsx
npm run build           # compile to JavaScript code
```

## ⚖️ License

This project is licensed under the OSI-approved **Mozilla Public License Version 2.0 (MPL-2.0)**.

See [`LICENSE`](./LICENSE) for the full text of the license. For a summary of the MPL-2.0, visit [choosealicense.com](https://choosealicense.com/licenses/mpl-2.0/).

## 💭 Contact

FastTrack is developed and maintained with love and care by me, jonasfdb <3

I can best be reached through Discord under the username **jonasfdb** if it is urgent. Otherwise, keep contact to Issues, Discussions and pull requests here or send an e-mail to **me@jonasfdb.cc**.