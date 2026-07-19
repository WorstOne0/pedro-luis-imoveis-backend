import axios from "axios";

/**
 * Talks to pedro_luis_imoveis_images.
 *
 * Every call forwards the caller's own Authorization header rather than holding
 * a service credential: the image server already validates the same tokens this
 * API issues, so there is no second secret to keep in sync.
 */

export const postToImageServer = async (endpoint, form, authorization) => {
  const response = await axios.post(`${process.env.IMAGE_SERVER}${endpoint}`, form, {
    headers: { ...form.getHeaders(), Authorization: authorization },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return response.data.payload;
};

// Stored values are public urls (`${HOST}/images/<filename>`), but the delete
// endpoint keys off the bare filename.
const toFilename = (url) => {
  if (!url || typeof url !== "string") return null;

  const [withoutQuery] = url.split("?");
  const filename = withoutQuery.split("/").pop();

  return filename || null;
};

/**
 * Best-effort removal of a listing's files.
 *
 * Deliberately never throws. It is called after the document is already gone,
 * so a failure here cannot un-delete anything — turning it into a 500 would
 * report failure for an operation that mostly succeeded, and invite a retry
 * against an id that no longer exists. Failures are returned so the caller can
 * log them.
 */
export const deleteFromImageServer = async (urls, authorization) => {
  const filenames = [...new Set(urls.map(toFilename).filter(Boolean))];

  const results = await Promise.allSettled(
    filenames.map((filename) =>
      axios.post(`${process.env.IMAGE_SERVER}/upload/delete`, { filename }, { headers: { Authorization: authorization } }),
    ),
  );

  // A file already missing from disk is the state we wanted, not an error.
  const failed = filenames.filter((_, index) => {
    const result = results[index];
    return result.status === "rejected" && result.reason?.response?.status !== 404;
  });

  return { deleted: filenames.length - failed.length, failed };
};
