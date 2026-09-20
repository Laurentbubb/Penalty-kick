using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Base du GameManager pour une future version Unity de PenaltyMind.
/// Le prototype navigateur utilise game.js.
/// </summary>
public class GameManager : MonoBehaviour
{
    public enum Direction
    {
        Left,
        Center,
        Right
    }

    [Header("Partie")]
    [SerializeField] private int maxShots = 10;

    [Header("Score")]
    [SerializeField] private int sideShotPoints = 120;
    [SerializeField] private int centerShotPoints = 80;
    [SerializeField] private int comboBonus = 25;

    [Header("Gardien")]
    [SerializeField] private int historySize = 5;

    private int currentShot;
    private int score;
    private int combo;

    private readonly List<Direction> shotHistory =
        new List<Direction>();

    public int CurrentShot => currentShot;
    public int Score => score;
    public int Combo => combo;

    private void Start()
    {
        StartGame();
    }

    public void StartGame()
    {
        currentShot = 1;
        score = 0;
        combo = 0;
        shotHistory.Clear();
    }

    public void TakePenalty(Direction playerDirection)
    {
        if (currentShot > maxShots)
            return;

        Direction goalkeeperDirection =
            ChooseGoalkeeperDirection();

        bool scored =
            playerDirection != goalkeeperDirection;

        if (scored)
        {
            int points =
                playerDirection == Direction.Center
                    ? centerShotPoints
                    : sideShotPoints;

            points += combo * comboBonus;

            score += points;
            combo++;
        }
        else
        {
            combo = 0;
        }

        RegisterShot(playerDirection);

        Debug.Log(
            $"Tir {currentShot}: {playerDirection} | " +
            $"Gardien: {goalkeeperDirection} | " +
            $"But: {scored} | Score: {score}"
        );

        currentShot++;

        if (currentShot > maxShots)
            EndGame();
    }

    private Direction ChooseGoalkeeperDirection()
    {
        if (shotHistory.Count == 0)
            return RandomDirection();

        int left = 0;
        int center = 0;
        int right = 0;

        foreach (Direction direction in shotHistory)
        {
            switch (direction)
            {
                case Direction.Left:
                    left++;
                    break;

                case Direction.Center:
                    center++;
                    break;

                case Direction.Right:
                    right++;
                    break;
            }
        }

        int max =
            Mathf.Max(left, Mathf.Max(center, right));

        List<Direction> candidates =
            new List<Direction>();

        if (left == max)
            candidates.Add(Direction.Left);

        if (center == max)
            candidates.Add(Direction.Center);

        if (right == max)
            candidates.Add(Direction.Right);

        Direction mostUsed =
            candidates[
                Random.Range(0, candidates.Count)
            ];

        float learningStrength =
            Mathf.Min(
                0.35f + currentShot * 0.055f,
                0.90f
            );

        if (Random.value < learningStrength)
            return mostUsed;

        return RandomDirection();
    }

    private Direction RandomDirection()
    {
        return (Direction)Random.Range(0, 3);
    }

    private void RegisterShot(Direction direction)
    {
        shotHistory.Add(direction);

        if (shotHistory.Count > historySize)
            shotHistory.RemoveAt(0);
    }

    private void EndGame()
    {
        Debug.Log(
            $"Partie terminée ! Score final : {score}"
        );

        // À connecter plus tard :
        // - écran de fin
        // - meilleur score
        // - pubs
        // - classement
        // - mode 1v1
    }
}
