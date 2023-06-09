import * as Yup from "yup";
import User from "../models/User";
import File from "../models/File";

class UserController {
    /* MOSTRAR USUÁRIOS */
    async index(req, res) {
        try {
            const users = await User.findAll({
                include: [{
                    model: File,
                    as: 'avatar',
                    attributes: ['name', 'path', 'url']
                }],
                order: [
                    ['createdAt', 'DESC'],
                ],
            });

            return res.json(users);
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: 'Não foi possível mostrar os usuários' })
        }
    }

    async indexAll(req, res) {
        try {
            const users = await User.findAll({
                include: [{
                    model: File,
                    as: 'avatar',
                    attributes: ['name', 'path', 'url']
                }],
                order: [
                    ['createdAt', 'DESC'],
                ],
            });

            const registros = users.length;

            return res.json({ content: users, registros: registros });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: 'Não foi possível mostrar os usuários' })
        }
    }

    /* REGISTRAR USUÁRIO */
    async store(req, res) {
        try {
            const schema = Yup.object().shape({
                name: Yup.string().required(),
                email: Yup.string().email().required(),
                password: Yup.string().min(8).required(),
                telefone: Yup.string().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).jsont({ message: "Erro na validação!" })
            }

            const data = req.body;
            const userExists = await User.findOne({
                where: { email: data.email }
            });
            if (userExists) {
                return res.status(400).json({ error: "E-mail já cadastrado!" });
            }

            const { id, name, email, telefone } = await User.create(data);
            return res.status(200).json({ id, name, email, telefone });

        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: 'Não foi possível registrar o usuário!' });
        }
    }

    /* ATUALIZAR USUÁRIO */
    async update(req, res) {
        try {
            const schema = Yup.object().shape({
                name: Yup.string(),
                email: Yup.string().email(),
                telefone: Yup.string(),
                cidade: Yup.string(),
                endereco: Yup.string(),
                oldPassword: Yup.string().min(8),
                password: Yup.string().min(8).when('oldPassword', (oldPassword, field) => {
                    oldPassword ? field.required() : field
                }),
                confirmPassword: Yup.string().when('password', (password, field) => {
                    password ? field.required().oneOf([Yup.ref('password')]) : field
                }),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({ message: "Erro na validação!" })
            }

            const { id } = req.params;
            const { email, oldPassword } = req.body;

            //Verificação de email caso usuário queira alterá - lo.
            const user = await User.findByPk(id);
            if (email !== user.email) {
                const userExists = await User.findOne({ where: { email } });
                if (userExists) {
                    return res.status(400).json({ message: "E-mail já cadastrado!" })
                }
            }

            //Verifica se informou a senha antiga, ou seja, quer alterar a senha
            if (oldPassword && !(await user.checkPassword(oldPassword))) {
                return res.status(401).json({ message: "Senha incorreta!" })
            }
            const data = req.body;
            const response = await user.update(data, {
                include: {
                    model: File,
                    as: 'avatar',
                    attributes: ['name', 'path', 'url']
                }
            });

            return res.status(200).json(response);
        } catch (err) {
            console.log(err);
            return res.status(400).json({ message: 'Não foi possível alterar os dados!' });
        }
    }

    /* Deletar Usuário */
    async destroy(req, res) {
        try {
            const { id } = req.params;
            await User.destroy({
                where: { id },
            });
            return res.json({ message: "Deletado com sucesso!" });
        } catch (err) {
            return res.json({ error: "Não foi possivel deletar o usuario" });
        }
    }
}

export default new UserController();