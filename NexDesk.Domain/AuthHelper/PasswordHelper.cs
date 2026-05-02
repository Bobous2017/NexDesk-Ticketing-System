using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace NexDesk.Domain.AuthHelper
{
    public static class PasswordHelper
    {
        // Omdanner en adgangskode i klartekst til en unik SHA256-hashstreng.
        // Bruges når en bruger oprettes eller opdaterer sin adgangskode.
        public static string Hash(string password)
        {
            using var sha256 = SHA256.Create();  // Initialiserer SHA256-algoritmen til kryptering.
            var bytes = Encoding.UTF8.GetBytes(password);  // Konverterer tekststrengen til et byte-array, som algoritmen kan læse.
            var hash = sha256.ComputeHash(bytes); // Genererer selve hashen baseret på de indsendte bytes.

            var sb = new StringBuilder();  // Konverterer byte-resultatet til en læsbar hexadecimal-streng (f.eks. "a1b2c3...").
            foreach (var b in hash)
                sb.Append(b.ToString("x2"));

            return sb.ToString();
        }


        // Sammenligner en indtastet adgangskode med den gemte hash fra databasen.
        // Returnerer 'true', hvis de matcher, hvilket giver brugeren adgang.
        public static bool Verify(string password, string storedHash)
        {
            var hashedInput = Hash(password);  // Hasher det indtastede kodeord for at se, om det giver samme resultat som det gemte.

            // DEBUG OUTPUT
            Console.WriteLine("[DEBUG] Raw Input Password: " + password);
            Console.WriteLine("[DEBUG] Hashed Input:       " + hashedInput);
            Console.WriteLine("[DEBUG] Stored Hash:        " + storedHash);

            return string.Equals(hashedInput, storedHash, StringComparison.OrdinalIgnoreCase);  // Sammenligner de to hashes (ignorerer store/små bogstaver for en sikkerheds skyld).
        }

    }
}
