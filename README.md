# PBNWeb

PBNWeb is a simple browser-based tool for creating, editing and validating
bridge deal collections in PBN (Portable Bridge Notation) format.

The application is designed to make it easy to collect bridge deals from
different sources, complete a deal collection over time, and export the
finished collection as a PBN file.

## Purpose

Preparing bridge deals for teaching, training or competitions often involves
deals coming from different sources.

PBNWeb provides a simple workflow where deals can be:

- entered manually
- pasted as PBN Deal text
- loaded from an existing PBN file
- added or edited later
- validated before export

The completed collection can then be exported as a PBN file for use with
bridge software and card dealing systems that support PBN.

## Features

- Create new deal collections
- Open existing PBN files
- Enter bridge hands manually
- Paste deals using PBN Deal notation
- Add, replace, clear and remove boards
- Automatic sorting of cards
- Display of remaining cards while entering a deal
- Automatic dealer and vulnerability based on board number
- Validation of complete 52-card deals
- Detection of duplicate and invalid cards
- Export deal collections to PBN
- Tournament name, location and date metadata
- Runs locally in a web browser

## Swedish adaptations

PBN is an international format, but PBNWeb currently has a Swedish user
interface and some adaptations aimed at Swedish bridge clubs and their
typical workflows.

The generated files use standard PBN notation and are intended to remain
compatible with other software supporting the PBN format.

## Running PBNWeb

PBNWeb is written in plain HTML, CSS and JavaScript.

It does not require a server, database or installation.

Download the project files and open:

`index.html`

in a web browser.

PBN files are read, edited and generated locally on the user's computer.
No server is required for processing the deals.

## Typical workflow

1. Create a new deal collection or open an existing PBN file.
2. Add a board.
3. Enter the cards manually or paste a deal as text.
4. Add and edit additional boards as required.
5. Validate the deals.
6. Export the completed collection as a PBN file.

A collection does not have to be completed at once. Empty boards can be
left in the collection and filled in later.

## Pasted deal format

A deal can be pasted using PBN Deal notation, for example:

`N:3.AT.KT987.AQJ83 JT942.6543.AJ5.2 K5.K9872.63.T976 AQ876.QJ.Q42.K54`

The first letter specifies which hand is written first. The remaining hands
follow clockwise around the table.

For example:

`N:` means that the first hand is North, followed by East, South and West.

Within each hand, suits are written in the order:

`Spades.Hearts.Diamonds.Clubs`

Card ranks are represented as:

`A K Q J T 9 8 7 6 5 4 3 2`

where `T` represents ten.

## PBN export

PBNWeb exports standard PBN deal information including:

- Event
- Site
- Date
- Board
- Dealer
- Vulnerable
- Deal

The exported deal collection can then be used by other bridge applications
that support PBN.

## Author

Developed by Mats Hammarqvist with AI-assisted development using ChatGPT
and Codex.

## Project status

PBNWeb is currently under development.

The project is being tested with real bridge deal workflows. Functionality
and the user interface may therefore change as testing continues.

Feedback, testing and suggestions are welcome.
