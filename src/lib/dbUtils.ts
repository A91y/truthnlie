import { db } from "./db";

/**
 * Creates a user if they do not already exist.
 * @param wallet - The wallet address of the user.
 * @param name - The name of the user.
 * @returns The existing or newly created user.
 */
export async function createUserIfNotExists(wallet: string, name: string) {
  const existingUser = await getUser(wallet);

  if (existingUser) {
    return existingUser;
  }

  return db.user.create({
    data: {
      wallet,
      name,
    },
  });
}

/**
 * Retrieves a user by their wallet address.
 * @param wallet - The wallet address of the user.
 * @returns The user if found, otherwise null.
 */
export async function getUser(wallet: string) {
  return db.user.findUnique({
    where: {
      wallet,
    },
  });
}

/**
 * Creates a challenge with the specified parameters.
 * @param wallet - The wallet address of the user creating the challenge.
 * @param maxChallengers - The maximum number of challengers allowed.
 * @param statements - An array of three statements.
 * @param lieIndex - The index of the lie in the statements array.
 * @returns The ID of the newly created challenge.
 * @throws Will throw an error if the number of statements is not 3 or if the lieIndex is out of range.
 */
export async function createChallenge(
  wallet: string,
  maxChallengers: number,
  statements: string[],
  lieIndex: number
) {
  // validations
  if (statements.length !== 3) {
    throw new Error("There must be exactly 3 statements");
  }
  if (lieIndex < 0 || lieIndex > 2) {
    throw new Error("lieIndex must be between 0 and 2");
  }

  const existingWallet = await db.user.findUnique({
    where: { wallet },
  });

  if (!existingWallet) {
    throw new Error("Wallet not found");
  }

  const challenge = await db.challenge.create({
    data: {
      wallet,
      maxChallengers,
      statements,
      lieIndex,
    },
  });
  return challenge.id;
}

/**
 * Retrieves a challenge by its ID.
 * @param id - The ID of the challenge.
 * @returns The challenge if found, otherwise null.
 */
export async function getChallenge(id: string) {
  return db.challenge.findUnique({
    where: {
      id,
    },
  });
}

/**
 * Retrieves all challenges created by a specific user.
 * @param wallet - The wallet address of the user.
 * @returns An array of challenges created by the user.
 */
export async function getChallenges(wallet: string) {
  return db.challenge.findMany({
    where: {
      wallet,
    },
  });
}

/**
 * Retrieves all challenges where a specific user is a challenger.
 * @param wallet - The wallet address of the challenger.
 * @returns An array of challenges where the user is a challenger.
 */
export async function getChallengesByChallenger(wallet: string) {
  return db.challenge.findMany({
    where: {
      challengers: {
        some: {
          wallet,
        },
      },
    },
  });
}

/**
 * Adds a challenger to a challenge and updates their guess.
 * @param challengeId - The ID of the challenge.
 * @param wallet - The wallet address of the challenger.
 * @param guessSignature - The signature of the guess.
 * @param correct - Whether the guess was correct.
 * @returns The updated challenge.
 */
export async function addChallenger(
  challengeId: string,
  wallet: string,
  guessSignature: string,
  correct: boolean
) {
  return db.challenge.update({
    where: {
      id: challengeId,
    },
    data: {
      challengers: {
        connect: {
          wallet,
        },
      },
      [correct ? "correctGuesses" : "incorrectGuesses"]: {
        push: guessSignature,
      },
    },
  });
}
