# wax-bulk-template-creator

Quick and dirty script to create a bulk nfts for uploading to wax

⚠️⚠️You will have to edit the code this is not an command line tool.⚠️⚠️

# 📦 Requirments

-   [Node.js v18 or higher](https://nodejs.org/en/)

## How to use

1.  Type in the terminal:

    ```bash
    # install dependencies
    $ npm install
    ```

2.  copy over the `.env-example` to `.env` and fill in the values

3.  fill in the values in `template.json`

4.  in `main.ts` for the function `createActions` adjust line 34 to your keys in the `template.json`
    than go to `immutable_data` in that same function and add the values you want

5.  run the script with

    ```bash
    $ npm run start
    ```
