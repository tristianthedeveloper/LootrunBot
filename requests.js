const axios = require('axios').default;
const wynnWrap = async (uuidIgn) => {
    return await axios
        .get(`https://api.wynncraft.com/v2/player/${uuidIgn}/stats`)
        .then((data) => {
            if (data.status === 200) {
                return (data)
            } else if (data.status !== 429) {
                return axios
                    .get(
                        `https://api.mojang.com/users/profiles/minecraft/${uuidIgn}`
                    )
                    .then((data) => {
                        if (data.data.id.length === 32) {
                            return axios
                                .get(
                                    `https://api.wynncraft.com/v2/player/${addDashesToUuid(
                                        data.data.id
                                    )}/stats`
                                )
                                .then((data) => {
                                    return (data)
                                })
                                .catch((err) => {
                                    console.log('catch 167')
                                    return (undefined)
                                })
                        } else {
                            console.log('uuid failed for ', uuidIgn)
                            return (undefined)

                        }
                    })
                    .catch((err) => {

                        console.log('catch 172')
                        return (undefined)
                    })
            }
        })
        .catch((err) => {
            if (err) {
                if (err.message.split(' ').slice(0, 10).includes('429')) {
                    return ('429');
                } else {
                    return (undefined)
                }
            } else {
                return axios
                    .get(
                        `https://api.mojang.com/users/profiles/minecraft/${uuidIgn}`
                    )
                    .then((data) => {
                        return axios
                            .get(
                                `https://api.wynncraft.com/v2/player/${addDashesToUuid(
                                    data.data.id
                                )}/stats`
                            )
                            .then((data) => {
                                return (data)
                            })
                            .catch((err) => {
                                return (undefined)
                            })
                    })
                    .catch((err) => {

                        console.log('catch 196', err)
                        return (undefined)
                    })
            }
        })
}
const getData = async (name) => {


    const req = await wynnWrap(name);

    const data = req.data;



    return data;

}
module.exports = {
    wynnWrap,getData

}