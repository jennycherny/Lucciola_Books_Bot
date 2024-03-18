require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchData() {
  try {
    const { data: booksData, error: booksError } = await supabase
      .from("BooksData")
      .select("*");

      if (booksError) {
        throw booksError;
      }

    const { data: giftsData, error: giftsError } = await supabase
      .from("GiftsData")
      .select("*");

      if (giftsError) {
        throw giftsError;
      }
      
    const { data: promoData, error: promoError } = await supabase
      .from("Promo")
      .select("id, promo");

    const { data: imagesData, error: imagesError } = await supabase
      .from("ImagesData")
      .select("id, img2, img3, img4");

    const { data: languageData, error: languageError } = await supabase
      .from("Language")
      .select("id, language");

    const { data: rentedData, error: rentedError } = await supabase
      .from("Rented")
      .select("id, rented");

    if (
      booksError ||
      giftsError ||
      promoError ||
      imagesError ||
      languageError ||
      rentedError
    ) {
      throw (
        booksError ||
        giftsError ||
        promoError ||
        imagesError ||
        languageError ||
        rentedError
      );
    } else {
      const processedBooksData = booksData.map((book) => {
        const promo = promoData.find((promo) => promo.id === book.id);
        const images = imagesData.find((image) => image.id === book.id);
        const language = languageData.find(
          (language) => language.id === book.id
        );
        const rented = rentedData.find((rented) => rented.id === book.id);

        return {
          ...book,
          promo: promo ? promo.promo : null,
          images: images ? images : null,
          language: language ? language.language : null,
          rented: rented ? rented.rented : null,
        };
      });

      const processedGiftsData = giftsData.map((gift) => {
        const images = imagesData.find((image) => image.id === gift.id);

        return {
          ...gift,
          images: images ? images : null,
        };
      });

      const combinedData = [...processedBooksData, ...processedGiftsData];
      return combinedData;
    }
  } catch (error) {
    console.error("Ошибка при запросе данных:", error);
    throw error;
  }
}

module.exports = fetchData;
