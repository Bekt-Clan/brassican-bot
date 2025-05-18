<div align='center'>

# Brassican Bot

A Discord bot that runs the rank system for the
[Bekt Clan](https://discord.gg/7EwEDg6ezT).

Public information about how the rank system works can be found in the `#ranks`
channel in the [clan's Discord server](https://discord.gg/7EwEDg6ezT).

</div>

---

## Documentation

This project is built using the [discord.js module](https://discord.js.org/). It
generally follows a typical discord.js project structure. The bot uses the
[Wise Old Man API](https://www.wiseoldman.net/) to get useful information about
in-game data. [Mongoose](https://mongoosejs.com/) is used to interact with the
bot's MongoDB instance which is used for all persisted data.

If you are looking to get started understanding the code, it is recommended to
first familiarize yourself with
[discord.js's documentation](https://discord.js.org/docs/packages/discord.js/14.14.1).
It is very helpful, and will explain most of the background needed to understand
this repo.

The code QA is done with [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/). It is strongly recommended to use Visual Studio Code with the [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extensions installed to work on this project.

The Bekt clan currently hosts both the bot's live application code and its
database instance on [Railway](https://railway.app/) (we maintain both a
production and test environment).

## License

This project is licensed with the MIT License. All use of this code is
permitted. Acknowledgement of the Bekt clan and current project maintainers is
requested if you found this repo helpful in any way. Please use the following
block of text:

```
Brassican Bot Acknowledgements
https://github.com/tomking/brassican-bot
-   Bekt Clan: https://discord.gg/ujYPb8pcce
-   Maintainers:
    - Thomas/TR0P - https://github.com/tomking
    - Dennis/Kojonkler - https://github.com/Kojonkler
    - Disni - https://github.com/Disniew
```

## Contributing

Contributions to this project are welcome from all members of the community.
Changes to the rank system must be decided on by the staff team, however
suggestions are always welcome. Feel free to open issues within this repo to
discuss anything related to the technical aspects of the system (bug reports,
feature requests, etc.). Use the `#suggestions` channel in the clan's Discord
server for anything more general regarding the rank system. No support will be
offered for the rank system through this repository (use the `#tickets` channel
in the Discord server if you require assistance).

If you would like to help out with the code please see the open issues or
contact the current maintainers to get started. Pull requests are always
welcome and all help is appreciated! If you intend to open a pull request please
do so on the [dev branch](https://github.com/tomking/brassican-bot/tree/dev) and
write clear documentation both within your code and within your PR/commit
messages.
