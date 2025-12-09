// ============================================
// DESABILITAR PESQUISA - Mantém estrutura
// ============================================
// Para ativar: mude PESQUISA_ATIVA para false

const PESQUISA_ATIVA = false;

if (!PESQUISA_ATIVA) {
    document.addEventListener('DOMContentLoaded', function() {
        // Criar overlay com mensagem
        const overlay = document.createElement('div');
        overlay.id = 'pesquisaEncerradaOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #2B5BA8 0%, #1B3A6B 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 60px 40px;
                border-radius: 30px;
                text-align: center;
                max-width: 600px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: slideInScale 0.6s ease-out;
            ">
                <div style="font-size: 5em; margin-bottom: 20px;">✅</div>
                <h1 style="
                    color: #2B5BA8;
                    font-size: 2.8em;
                    font-weight: 800;
                    margin-bottom: 15px;
                    font-family: 'Poppins', sans-serif;
                ">Pesquisa Encerrada!</h1>
                
                <p style="
                    color: #6c757d;
                    font-size: 1.3em;
                    margin-bottom: 30px;
                    line-height: 1.6;
                    font-family: 'Poppins', sans-serif;
                ">
                    Obrigado por participar da pesquisa de opinião da <strong style="color: #2B5BA8;">Super FM 98.9</strong>!
                </p>

                <div style="
                    background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
                    padding: 30px;
                    border-radius: 20px;
                    margin-bottom: 30px;
                    border: 3px solid #2B5BA8;
                ">
                    <p style="
                        font-size: 1.2em;
                        color: #1B3A6B;
                        font-weight: 700;
                        margin-bottom: 10px;
                        font-family: 'Poppins', sans-serif;
                    ">📊 Pesquisa Finalizada em:</p>
                    <p style="
                        font-size: 2em;
                        color: #2B5BA8;
                        font-weight: 800;
                        font-family: 'Poppins', sans-serif;
                    ">10 de Dezembro de 2025</p>
                </div>

                <div style="
                    background: #FFF9C4;
                    padding: 20px;
                    border-radius: 15px;
                    border-left: 5px solid #FFD700;
                    margin-bottom: 30px;
                ">
                    <p style="
                        color: #F57F17;
                        font-weight: 600;
                        font-size: 1.1em;
                        margin: 0;
                        font-family: 'Poppins', sans-serif;
                    ">🎁 Sorteio: Resultado em breve na Super FM!</p>
                </div>

                <div style="
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                ">
                    <a href="https://www.superfmcr.com.br/" target="_blank" style="
                        background: linear-gradient(135deg, #2B5BA8 0%, #1B3A6B 100%);
                        color: white;
                        padding: 15px 40px;
                        border-radius: 50px;
                        text-decoration: none;
                        font-weight: 700;
                        font-size: 1.1em;
                        transition: all 0.3s ease;
                        font-family: 'Poppins', sans-serif;
                        display: inline-block;
                        box-shadow: 0 5px 20px rgba(43, 91, 168, 0.3);
                    " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 30px rgba(43, 91, 168, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 20px rgba(43, 91, 168, 0.3)';">
                        🌐 Visite nosso site
                    </a>
                    <a href="https://www.instagram.com/superfm98.9/" target="_blank" style="
                        background: white;
                        color: #2B5BA8;
                        padding: 15px 40px;
                        border-radius: 50px;
                        text-decoration: none;
                        font-weight: 700;
                        font-size: 1.1em;
                        transition: all 0.3s ease;
                        font-family: 'Poppins', sans-serif;
                        display: inline-block;
                        border: 3px solid #2B5BA8;
                        box-shadow: 0 5px 20px rgba(43, 91, 168, 0.2);
                    " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 30px rgba(43, 91, 168, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 20px rgba(43, 91, 168, 0.2)';">
                        📱 Instagram
                    </a>
                </div>

                <p style="
                    color: #999;
                    font-size: 0.95em;
                    margin-top: 30px;
                    font-family: 'Poppins', sans-serif;
                ">🎵 Mais alegria no ar!</p>
            </div>

            <style>
                @keyframes slideInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.8) translateY(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            </style>
        `;

        document.body.appendChild(overlay);

        // Bloquear scroll
        document.body.style.overflow = 'hidden';
    });
}
