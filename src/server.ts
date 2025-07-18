import express from "express";
import { PrismaClient } from "@prisma/client";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc",
        },
        include: {
            genres: true,
            languages: true,
        }
    });
    res.json(movies);
})

app.post("/movies", async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } = req.body;

    try {
        const movieWithSameTitle = await prisma.movie.findFirst({
            where: { title: { equals: title, mode: "insensitive" } },
        })

        if (movieWithSameTitle) {
            res
                .status(409)
                .json({ message: "Já existe um filme cadastrado com esse título" });
            return
        }
        await prisma.movie.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date)
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Falha ao cadastrar um filme" });
        return
    }

    res.status(201).json()
})

app.put("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({ where: { id } })

        if (!movie) {
            res.status(404).send({ message: "Filme não encontrado" });
            return
        }

        const data = { ...req.body };
        data.release_date = data.release_date ? new Date(data.release_date) : undefined;

        await prisma.movie.update({
            where: { id },
            data
        })
    } catch (error) {
        res.status(500).send({ message: "Falha ao atualizar o registro do filme" });
        return
    }

    res.status(200).send()
})

app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id)

    try {
        const movie = await prisma.movie.findUnique({ where: { id } })

        if (!movie) {
            res.status(404).send({ message: "Filme não encontrado" })
            return
        }

        await prisma.movie.delete({ where: { id } })

        res.status(202).send()
    } catch (error) {
        res.status(500).send({ message: "Não foi possível remover o filme" })
        return
    }
})

app.get("/movies/:genreName", async (req, res) => {

    try {
        const moviesFilteredByGenreName = await prisma.movie.findMany({
            where: {
                genres: {
                    name: {
                        equals: req.params.genreName,
                        mode: "insensitive"
                    }
                }
            },
            include: {
                genres: true,
                languages: true
            }
        })

        if (moviesFilteredByGenreName.length === 0) {
            res.status(404).send({ message: "Gênero não encontrado" })
            return
        }

        res.status(200).send(moviesFilteredByGenreName)
    } catch (error) {
        res.status(500).send({ message: "Falha ao filtrar filmes por gênero" })
    }

})

app.listen(port, () => {
    console.log(`Servidor em execução em http://localhost:${port}`);
})